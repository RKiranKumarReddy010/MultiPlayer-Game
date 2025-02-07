/*
  # Create games table for multiplayer number game

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `party_code` (text, unique)
      - `status` (text)
      - `players` (jsonb)
      - `current_round` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `games` table
    - Add policies for reading and updating games
*/

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_code text UNIQUE NOT NULL,
  status text NOT NULL,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_round jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read games"
  ON games
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert games"
  ON games
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update games"
  ON games
  FOR UPDATE
  TO public
  USING (true);