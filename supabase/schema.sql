CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'miner',
  waitlist_status TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  is_smart BOOLEAN NOT NULL DEFAULT FALSE,
  search_criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sref_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_value TEXT NOT NULL,
  sv_version INTEGER NOT NULL,
  title TEXT NOT NULL,
  copy_count INTEGER NOT NULL DEFAULT 0,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE code_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES sref_codes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE code_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES sref_codes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code_id, tag)
);

CREATE TABLE folder_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES sref_codes(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(folder_id, code_id)
);

CREATE TABLE saved_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES sref_codes(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code_id)
);

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE code_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES sref_codes(id) ON DELETE CASCADE,
  is_upvote BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sref_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public codes are viewable by everyone" ON sref_codes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own codes" ON sref_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own codes" ON sref_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own codes" ON sref_codes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Code images are viewable by everyone" ON code_images
  FOR SELECT USING (true);

CREATE POLICY "Users can create images for their own codes" ON code_images
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

CREATE POLICY "Code tags are viewable by everyone" ON code_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can create tags for their own codes" ON code_tags
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM sref_codes WHERE id = code_id
    )
  );

CREATE POLICY "Users can view their folder codes" ON folder_codes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM folders WHERE id = folder_id
    )
  );

CREATE POLICY "Users can manage their folder codes" ON folder_codes
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM folders WHERE id = folder_id
    )
  );

CREATE POLICY "Users can view their saved codes" ON saved_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their saved codes" ON saved_codes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Waitlist is viewable by admins" ON waitlist
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE tier = 'admin'
    )
  );

CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own votes" ON code_votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own votes" ON code_votes
  FOR ALL USING (auth.uid() = user_id);

-- RPC function to update vote counts efficiently
CREATE OR REPLACE FUNCTION update_code_vote_counts(code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sref_codes 
  SET 
    upvotes = (
      SELECT COUNT(*) FROM code_votes 
      WHERE code_votes.code_id = update_code_vote_counts.code_id 
      AND is_upvote = true
    ),
    downvotes = (
      SELECT COUNT(*) FROM code_votes 
      WHERE code_votes.code_id = update_code_vote_counts.code_id 
      AND is_upvote = false
    ),
    updated_at = NOW()
  WHERE id = update_code_vote_counts.code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
