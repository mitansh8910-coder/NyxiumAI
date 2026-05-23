async function sendToAI() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-messages');
    if(!input.value) return;
    
    // Add User Message
    chatBox.innerHTML += `<div class="flex gap-4 flex-row-reverse"><div class="bg-indigo-600 p-3 rounded-2xl rounded-tr-none text-sm">${input.value}</div></div>`;
    const userMsg = input.value;
    input.value = '';
    
    try {
        const res = await fetch('/api/chat', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ message: userMsg }) 
        });

        // Debug: Check if the response was okay
        if (!res.ok) {
            const errData = await res.text();
            throw new Error(`Server returned ${res.status}: ${errData}`);
        }

        const data = await res.json();
        chatBox.innerHTML += `<div class="flex gap-4"><div class="bg-slate-800 p-3 rounded-2xl rounded-tl-none text-sm">${marked.parse(data.reply)}</div></div>`;
    } catch (err) {
        // This will now show the REAL error in your chat window
        chatBox.innerHTML += `<div class="text-red-400 text-xs p-2">Debug Error: ${err.message}</div>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}
