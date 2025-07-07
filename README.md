
![og image](https://supermemory.ai/og-image.png)

# Supermemory
<div align="center">
  <a href="https://github.com/Dhravya/Supermemory/stargazers">
    <img src="https://img.shields.io/github/stars/Dhravya/Supermemory?style=flat-square&logo=github" alt="GitHub stars">
  </a>
  <a href="https://github.com/Dhravya/Supermemory/network/members">
    <img src="https://img.shields.io/github/forks/Dhravya/supermemory?style=flat-square&logo=github&color=8ae8ff" alt="GitHub forks">
  </a>
  <a href="https://github.com/Dhravya/Supermemory/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/Dhravya/Supermemory?style=flat-square&logo=github" alt="GitHub contributors">
  </a>
  <a href="https://chrome.google.com/webstore/detail/supermemory/afpgkkipfdpeaflnpoaffkcankadgjfc">
    <img src="https://img.shields.io/chrome-web-store/v/afpgkkipfdpeaflnpoaffkcankadgjfc?style=flat-square&color=yellow" alt="Chrome Web Store">
  </a>
</div>
<br>
<div align="center">
<a href="https://www.producthunt.com/posts/supermemory?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-supermemory" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=472686&theme=light&period=daily&t=1737414816950" alt="Supermemory - AI&#0032;second&#0032;brain&#0032;for&#0032;all&#0032;your&#0032;saved&#0032;stuff | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</div>



## 👀 What is this?

Supermemory exists to bring contextual knowledge to the age of LLMs. 
The vision is to be the universal engine for memory

LLMs are smart as fuck. but giving them the right context make them even more useful in most contexts.

Think about it - there’s countless use-cases where LLMs by themselves don’t do much, but giving them the right data can make it a magical experience.

Right data comes from everywhere. it’s literally with us. at all times. everything we see, hear, touch. is good data, USEFUL data. but then it all comes down to “how can i search for something within this pool of awesome stuff?”

We make the pool, and give the search tools.

That’s literally all Supermemory does. Every single project in our scope aids in doing one of the two things.

Whether it’s organizing personal information, enhancing applications with contextual intelligence, or enabling companies to centralize and retrieve internal knowledge, Supermemory becomes the core infrastructure for transforming scattered data into actionable insights.

## Key Features

- 💡 **Ideation**: Capture and save ideas effortlessly.
- 🔖 **Bookmarks**: Import, organize, and resurface bookmarks when needed.
- 📇 **Contacts**: Store and manage information about people you know.
- 🐦 **Twitter Bookmarks**: Import and utilize your saved tweets.
- 🔍 **Powerful Search**: Quickly find any saved information.
- 💬 **Chat with Collections**: Interact with specific knowledge bases.
- 🖼️ **Memory refresh**: Contextually shows relevant items for re-learning.
- ✍️ (soon) **Writing Assistant**: Use a markdown editor with AI assistance for content creation.
- 🔒 **Privacy Focused**: Ensures data security and privacy.
- 🏠 **Self Hostable**: Open source and easy to deploy locally.
- 🔗 **Integrations**: Compatible with Telegram, Twitter, Chrome bookmarks, Notion, and more to come.

## Supermemory API
Developers can make apps on top of supermemory using the [API](https://api.supermemory.ai). You can find the documentation here: https://docs.supermemory.ai

YOU can build cool stuff with supermemory.
1. Import tools 
2. Chat with (insert whatever here) apps 
3. Personalisation in existing apps 
4. Content management systems

## How do I use this?

Just go to [supermemory.com](https://supermemory.com) and sign in.

To use the chrome extension,

1. Download from [Chrome Web Store](https://chromewebstore.google.com/detail/supermemory/afpgkkipfdpeaflnpoaffkcankadgjfc?authuser=0&hl=en-GB)
2. Pin the supermemory chrome extension and just click on it to save the website.
   <img width="1058" alt="image" src="https://i.dhr.wtf/r/Clipboard_Jan_20,_2025_at_4.03 PM.png">

### Importing from integrations (Twitter, Chrome bookmarks, Notion, etc)

1. Open [Supermemory](https://supermemory.ai)
2. Follow the steps to connect your integrations
   <img width="480" alt="image" src="https://i.dhr.wtf/r/Clipboard_Jan_20,_2025_at_3.15 PM.png">
3. Voila! Now your second brain has all your twitter bookmarks.

#### Architecture:

<img width="715" alt="image" src="https://i.dhr.wtf/r/Clipboard_Jan_20,_2025_at_3.51 PM.png">


Supermemory has three main modules, managed by [turborepo](https://turbo.build):

#### `apps/web`: The main web UI.

![image](https://i.dhr.wtf/r/Clipboard_Jan_20,_2025_at_3.19 PM.png)

Built with:

- [Remix](https://remix.run/)
- [Hono](https://hono.dev/)
- [authkit-remix-cloudflare by Supermemory](https://github.com/supermemoryai/authkit-remix-cloudflare)
- [Drizzle ORM](https://drizzle.team/)
- [TailwindCSS](https://tailwindcss.com)
- [shadcn-ui](https://ui.shadcn.com)
- And some other amazing open source projects like [Plate](https://platejs.org/) and [vaul](https://vaul.emilkowal.ski/)
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)

#### `apps/extension`: Chrome extension

The [chrome extension](https://supermemory.ai/extension) is one of the most important part of the setup, but is not required.This is to easily add pages to your memory.

<img width="290" alt="image" src="https://i.dhr.wtf/r/Clipboard_Jan_20,_2025_at_4.05 PM.png">

> please rate the extension to improve the rating 🙏. 

Built with:

- [Extension JS](https://extension.js.org)
- [TailwindCSS](https://tailwindcss.com)
- [React](https://react.dev/)

#### `apps/backend`: This module handles the vector store and AI response generation

This is where the magic happens!
Built with:

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Postgres + Pgvector with Pgvectorscale](https://github.com/timescale/pgvectorscale)
- [Cloudflare Workflows](https://developers.cloudflare.com/queues/)
- [R2 Object storage](https://developers.cloudflare.com/r2/)
- [Markdowner by Supermemory](https://md.dhr.wtf)
- [Cloudflare KV](https://developers.cloudflare.com/kv)
- [mem0](https://app.mem0.ai)

## Is this free?

Yes, everything is free & open source.
Supermemory is built by [me](https://dhravya.dev), a college student. My life situations make it very difficult and almost impossible to monetise the product.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Dhravya/supermemory&type=Date)](https://star-history.com/#Dhravya/supermemory&Date)

## Contribute or self host

Supermemory is design to be set up easily locally and super duper easy to set up 💫

Please see the [SELF-HOSTING-GUIDE.md](SELF-HOSTING-GUIDE.md) for setup instructions.

## License

Supermemory is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License](LICENSE).

- You can use the code for personal projects, given appropriate attribution.
- For non-commercial use, the code must be open source.
- Please reach out to me if you want to use the code for commercial projects.

### Contributing

Contributions are very welcome! A contribution can be as small as a ⭐ or even finding and creating issues.

Thanks to all the awesome people who have contributed to supermemory.
<a href="https://github.com/Dhravya/SuperMemory/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Dhravya/SuperMemory" />
</a>

## Sponsors

We are grateful for the support of our supporters:

<table>
  <tr>
    <td align="center">
      <a href="https://www.cloudflare.com/">
        <img src="https://github.com/user-attachments/assets/182fa2e0-bc54-4115-a956-5fcfc748d277" width="100" alt="Cloudflare Compute">
      </a>
      <br>
      Cloudflare - Compute
    </td>
    <td align="center">
      <a href="https://vercel.com/">
        <img src="https://github.com/user-attachments/assets/b2923fdc-d2a7-46d1-b3e7-92a044d0f16d" width="100" alt="Vercel One Time">
      </a>
      <br>
      Vercel - One Time
    </td>
    <td align="center">
      <a href="https://coderabbit.io/">
        <img src="https://github.com/user-attachments/assets/7ada40ad-664f-46fe-b746-b35162bbb037" width="100" alt="Coderabbit Monthly">
      </a>
      <br>
      Coderabbit - Monthly ($50)
    </td>
  </tr>
</table>

## Operator CLI

A command-line interface is available in the `@supermemory/operator` package to help manage the database. Build the package and link the binary:

```bash
bun install
cd packages/operator && bun run build && bun link
```

Then run commands such as:

```bash
supermemory-operator create-user user@example.com
supermemory-operator list-users
supermemory-operator list-documents <userId> --sort created
supermemory-operator list-documents <userId> --sort title --desc
supermemory-operator create-space <userId> "My Space" --public
supermemory-operator list-spaces <userId>
supermemory-operator delete-user <userId>
supermemory-operator delete-space <spaceId>
supermemory-operator update-space <spaceId> -n "New Name" --public true
supermemory-operator add-waitlist someone@example.com
supermemory-operator list-waitlist
supermemory-operator add-space-member <spaceId> <userId>
supermemory-operator remove-space-member <spaceId> <userId>
supermemory-operator list-space-members <spaceId>

supermemory-operator remove-waitlist <email>
supermemory-operator create-document <userId> <url> --title "Title"
supermemory-operator delete-document <documentId>
supermemory-operator update-document <documentId> --title "New Title"
supermemory-operator update-user <userId> --email new@example.com
supermemory-operator add-document-space <documentId> <spaceId>
supermemory-operator remove-document-space <documentId> <spaceId>
supermemory-operator show-user <userId>
supermemory-operator show-document <documentId>
supermemory-operator show-space <spaceId>
supermemory-operator list-space-documents <spaceId>
```

