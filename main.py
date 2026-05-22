# nyxium_limits.py - Add this dictionary at the top of your bot code
user_search_counts = {}

@bot.command(name="play")
async def play(ctx, *, search: str):
    user_id = ctx.author.id
    
    # Track searches
    count = user_search_counts.get(user_id, 0)
    
    if count >= 7:
        # Create a professional Nyxium branding embed
        embed = discord.Embed(
            title="Nyxium AI Access Limit 🤖",
            description="You've reached your free 7-search limit. To get **unlimited music access** and enable 24/7 playback, add Nyxium AI to your own server!",
            color=0x7289da # Discord blurple color
        )
        embed.set_thumbnail(url="YOUR_BOT_AVATAR_URL")
        embed.add_field(name="Upgrade to Nyxium AI", value="[Invite Nyxium to your server](https://your-invite-link-here.com)")
        await ctx.send(embed=embed)
        return

    # If they are under the limit, track the search
    user_search_counts[user_id] = count + 1
    
    # Your existing Cobalt/Search logic goes here...
    await ctx.send(f"🤖 Nyxium AI is processing '{search}' ({7 - user_search_counts[user_id]} searches left)...")
