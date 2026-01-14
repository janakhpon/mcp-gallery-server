# MCP in Modern Development

### Not magic. Not hype. Just a clean way to let AI touch your system without breaking it.

Most apps today look like this:

- Buttons
- Forms
- APIs
- Permissions
- Business rules

Then we add AI and, at first, it feels amazing:

- “Ask AI to do things”
- “Let users talk instead of clicking”
- “Feels futuristic”

Then reality hits and The AI:

- tries to do things users shouldn’t
- guesses wrong actions
- mixes up flows
- behaves differently every time you change a prompt

That’s when MCP starts to make sense.

## What MCP Actually Is

**MCP (Model Context Protocol)** is a way to expose your system to AI **safely and clearly**.

Think of MCP like a **USB-C port**:

- Your app already works
- Your APIs already work
- MCP does NOT replace them

MCP just defines:

> “These are the only things AI is allowed to do, and this is how.”

No more. No less.

## MCP Is NOT Replacing Your UI, it will work along with it

MCP is **not** not about:

- replacing buttons
- replacing forms
- replacing workflows

Your app still works the normal way, users can:

- click buttons
- use dropdowns
- submit forms

MCP simply adds another way to interact with your app: "Same backend. Same rules. Same permissions".

## A normal app, with MCP added

Without MCP:

```
User → UI → Backend API → Database
```

With MCP:

```
User → UI → Backend API → Database
User → AI Assistant → MCP → Backend API → Database
```

So, no magic here, no hidden secrets, no hidden logic, and

- **Backend APIs don’t change**
- **Business logic doesn’t move**
- **Permissions still live on the backend**

## What MCP Exposes?

MCP does NOT expose:

- raw tables
- raw endpoints
- internal logic

It exposes **intent-based capabilities**.

Instead of:

```
POST /images
DELETE /images/:id
```

You expose:

```
upload_image
list_images
search_images
delete_image
```

Each one:

- has a name
- has input rules
- has a clear purpose

The AI doesn’t “figure things out”. It **requests permission to act**.

## “But Isn’t This Just Tool Calling?”

Yes… and no.

Tool calling is **part of the story**, not the whole story.

### Tool calling:

- usually defined inside prompts
- tied to model behavior
- easy to change accidentally
- harder to keep consistent across apps

### MCP:

- defined at the system level
- stable and shared across web, mobile, scripts
- same rules everywhere
- easier to audit and reason about

## Why MCP Feels Boring (And That’s Good)

MCP does not make AI smarter.

It makes AI:

- predictable
- boring
- safe

And boring systems:

- scale better
- break less
- wake you up less at night

> “The strongest systems are the ones you don’t notice.”
> — every senior engineer ever

## When MCP Makes Sense

Use MCP when:

- AI can change data
- AI triggers workflows
- permissions matter
- you have web + mobile
- you want consistent behavior

Skip MCP when:

- AI is read-only
- you’re just experimenting
- mistakes don’t matter

# Hands-On Section, MCP in a Real App (Web + Mobile)

Enough theory. Let’s build something real.

In this part:

- MCP server runs as a **standalone process**
- Uses `gpt-4o-mini`
- Exposes **tools, resources, prompts**
- Works with:
  - Next.js (web)
  - React Native Expo (mobile)

No Claude Desktop.
No special client.
Just real apps.

## The MCP Server

The MCP server is **not your backend**.

It sits **in front of your backend**, acting as a translator between:

- AI intent
- real APIs

### What the MCP Server Does

- tells AI what actions exist
- validates inputs
- calls your REST API
- returns results

AI never:

- touches DB
- bypasses auth
- invents endpoints

### Project Structure

```
src/mcp/
  └── mcp-server.ts
```

### Server Setup (High Level)

```ts
const server = new Server(
  { name: 'gallery-api-mcp', version: '1.0.0' },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  },
);
```

This says:

> “These are the ONLY things AI is allowed to see and do.”

## Tools = Actions (Write / Change)

Examples:

- upload image
- delete image
- search images

Each tool:

- has a name
- has a schema
- cannot be invented by the AI

This is the **main safety layer**.

## Resources = Read-Only

Resources let AI **read data safely**.

Example:

```
images://catalog
```

AI can:

- list
- analyze
- summarize

But: "cannot modify"

## Prompts = Reusable Guidance

Prompts are:

- predefined flows
- consistent instructions
- reusable across clients

They reduce:

- prompt drift
- copy-paste chaos

## Tool Execution Flow (Important)

When AI wants to act:

1. AI requests a tool
2. MCP validates inputs
3. MCP calls your API
4. API enforces rules
5. Result is returned

Hard rule:

> **AI never talks to your backend directly**

## Why This Matters in Real Apps

Now look at your apps:

### Web (Next.js)

- chat sidebar
- assistant button
- confirmation UI

### Mobile (React Native)

- chat screen
- offline handling
- retry logic

Both:

- talk to the same MCP-backed chat API
- get the same behavior
- follow the same rules

No duplication. No special logic per platform.

## MCP + Traditional UI = Best Combo

This is the key idea of the whole article:

> MCP does not replace UI.
> MCP **augments** it.

Users still:

- click buttons
- see confirmations
- stay in control

AI just:

- helps faster
- reduces clicks
- understands intent

## Real Example

User types:

> “Delete the blurry sunset photo”

What happens:

1. AI understands intent
2. Requests `search_images`
3. Requests `delete_image`
4. Backend validates permission
5. UI shows confirmation
6. Action happens

Nothing magical. Just clean layers.

## Final Thought

MCP is not about AI.

It’s about **system design**.

It forces you to:

- name your actions
- define boundaries
- think in intents, not endpoints

AI becomes:

- a user of your system
- not a god inside it

If you already have:

- a backend
- APIs
- UI
- permissions

MCP is just the missing piece that lets AI join the system **without breaking it**.

## Quick Start

```bash
# 1. Environment
cp env.example .env
docker-compose up -d

# 2. Dependencies & Database
npm install
npx prisma migrate dev
npx prisma generate

# 3. Run
npm run start:dev
ngrok http 3001 # for react native
```

## Resources

[GitHub Repository for MCP server](https://github.com/janakhpon/nestjs-gallery-api)
[GitHub Repository for Web](https://github.com/janakhpon/nestjs-gallery-ui)
[GitHub Repository for Mobile](https://github.com/janakhpon/nestjs-gallery-mobile)
