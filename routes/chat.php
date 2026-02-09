<?php

use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat/{conversation}', [ChatController::class, 'show'])->name('chat.show');
    Route::post('/chat/messages', [ChatController::class, 'store'])->name('chat.store');
    Route::post('/chat/search-users', [ChatController::class, 'searchUsers'])->name('chat.search-users');
    Route::post('/chat/start-conversation', [ChatController::class, 'startConversation'])->name('chat.start-conversation');
    Route::post('/chat/{conversation}/mark-as-read', [ChatController::class, 'markAsRead'])->name('chat.mark-as-read');
    Route::post('/chat/{conversation}/typing', [ChatController::class, 'typing'])->name('chat.typing');
});
