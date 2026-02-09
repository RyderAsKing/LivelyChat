<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users if they don't exist
        $user1 = User::firstOrCreate(
            ['email' => 'alice@example.com'],
            [
                'name' => 'Alice Johnson',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $user2 = User::firstOrCreate(
            ['email' => 'bob@example.com'],
            [
                'name' => 'Bob Smith',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $user3 = User::firstOrCreate(
            ['email' => 'charlie@example.com'],
            [
                'name' => 'Charlie Brown',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create conversations
        $conversation1 = Conversation::findOrCreateBetween($user1->id, $user2->id);
        $conversation2 = Conversation::findOrCreateBetween($user1->id, $user3->id);

        // Create sample messages for conversation 1
        $messages1 = [
            ['sender' => $user1, 'receiver' => $user2, 'body' => 'Hey Bob! How are you?'],
            ['sender' => $user2, 'receiver' => $user1, 'body' => 'Hi Alice! I\'m doing great, thanks! How about you?'],
            ['sender' => $user1, 'receiver' => $user2, 'body' => 'I\'m good! Working on this new chat feature.'],
            ['sender' => $user2, 'receiver' => $user1, 'body' => 'That sounds exciting! Can\'t wait to see it.'],
            ['sender' => $user1, 'receiver' => $user2, 'body' => 'It\'s coming along nicely. Real-time messaging is working!'],
        ];

        foreach ($messages1 as $index => $messageData) {
            $message = Message::create([
                'conversation_id' => $conversation1->id,
                'sender_id' => $messageData['sender']->id,
                'receiver_id' => $messageData['receiver']->id,
                'body' => $messageData['body'],
                'is_read' => $index < 3, // First 3 messages are read
                'created_at' => now()->subMinutes(10 - $index),
            ]);
        }

        $conversation1->update(['last_message_at' => now()->subMinutes(5)]);

        // Create sample messages for conversation 2
        $messages2 = [
            ['sender' => $user3, 'receiver' => $user1, 'body' => 'Hi Alice! Long time no see.'],
            ['sender' => $user1, 'receiver' => $user3, 'body' => 'Hey Charlie! Indeed! How have you been?'],
            ['sender' => $user3, 'receiver' => $user1, 'body' => 'Pretty good! Just been busy with work.'],
        ];

        foreach ($messages2 as $index => $messageData) {
            $message = Message::create([
                'conversation_id' => $conversation2->id,
                'sender_id' => $messageData['sender']->id,
                'receiver_id' => $messageData['receiver']->id,
                'body' => $messageData['body'],
                'is_read' => true,
                'created_at' => now()->subHours(2)->addMinutes($index),
            ]);
        }

        $conversation2->update(['last_message_at' => now()->subHours(2)->addMinutes(2)]);

        $this->command->info('Chat test data created successfully!');
        $this->command->info('Test users:');
        $this->command->info('  - alice@example.com (password: password)');
        $this->command->info('  - bob@example.com (password: password)');
        $this->command->info('  - charlie@example.com (password: password)');
    }
}
