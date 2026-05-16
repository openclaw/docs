export const elementsFixture = `---
title: "Docs elements"
summary: "Hidden fixture page for docs shell visual QA."
status: "visual fixture"
applies_to: "docs shell"
beta: true
---

# Docs elements

This hidden page exercises the docs shell renderer. It is not linked from navigation, the sitemap, or the docs index.

## Text and inline code

OpenClaw docs use compact developer prose with **strong emphasis**, [inline links](/start/getting-started), inline code such as \`openclaw onboard\`, and <Tooltip tip="JSON5 supports comments and trailing commas">**tooltip text**</Tooltip>.

Feature labels stay inline: <Badge color="orange">Beta</Badge> <Badge color="green">Stable</Badge>

> Blockquotes should stay quiet and readable without becoming callout boxes.

### Heading level three

Use h3 sections for local structure inside a major task.

#### Heading level four

Use h4 sections sparingly for small reference clusters.

- Unordered lists should stay compact.
- List items can include \`inline code\`, **strong text**, and links.
  - Nested items should not collide with surrounding rhythm.

1. Ordered lists should keep readable spacing.
2. They should not look like step components.

Keyboard hints such as <kbd>⌘</kbd><kbd>K</kbd> should render as small controls.

## Callouts

<Tip>
Use tips for shortcuts that save setup time without changing the required path.
</Tip>

<Info>
Use info notices for contextual details that help readers choose the right route.
</Info>

<Note>
Use notes for extra constraints that matter but are not urgent.
</Note>

<Warning>
Use warnings for mistakes that can break auth, leak secrets, or leave a Gateway unreachable.
</Warning>

<Check>
Use check callouts to confirm a successful state after setup.
</Check>

<Say>
Use say callouts for exact text a reader can send to an agent or channel.
</Say>

<Banner>
Use banners for short page-level state such as beta guidance, migration notices, or temporary service notes.
</Banner>

<Update>
Use updates for recent behavior changes that matter to returning readers.
</Update>

## Code

\`\`\`ts scripts/docs-site/example.ts lines {2} focus=2-3
export function startGateway() {
  return "openclaw gateway restart";
}
\`\`\`

<CodeGroup>

\`\`\`sh Terminal
openclaw status --deep
openclaw gateway restart
curl -fsSL https://documentation.openclaw.ai/llms.txt
\`\`\`

\`\`\`json openclaw.json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "groupPolicy": "allowlist"
    }
  }
}
\`\`\`

</CodeGroup>

<Prompt title="Agent prompt">
Summarize the active OpenClaw Gateway health and include the exact command that proves it.
</Prompt>

## Cards

<CardGroup cols={3}>
  <Card title="Get started" href="/start/getting-started" icon="rocket">
    Install OpenClaw, run onboarding, and send the first message.
  </Card>
  <Card title="Gateway config" href="/gateway/configuration" icon="gear">
    Configure auth, channels, models, and runtime defaults.
  </Card>
  <Card title="Troubleshooting" href="/help/troubleshooting" icon="wrench">
    Diagnose startup, auth, channel, and provider issues.
  </Card>
  <Card title="Plugin SDK" href="/plugins/sdk" icon="book">
    Build plugin surfaces using the public SDK contracts.
  </Card>
  <Card title="Configuration" href="/gateway/configuration" icon="settings">
    Review production defaults and channel-specific overrides.
  </Card>
  <Card title="Remote access" href="/gateway/remote" icon="globe">
    Expose the Gateway safely when a channel needs inbound webhooks.
  </Card>
</CardGroup>

## Columns

<Columns>
  <Card title="Channel guide" href="/channels" icon="globe">
    Compare channel setup paths without changing the page rhythm.
  </Card>
  <Card title="Model guide" href="/models" icon="sparkles">
    Keep adjacent cards aligned when content lengths differ.
  </Card>
</Columns>

## Tiles and panels

<Snippet file="./snippet-fixture.md" />

<TileGroup>
  <Tile title="Release notes" href="/releases" icon="book">
    Compact routing links should work without becoming another full card grid.
  </Tile>
  <Tile title="Gateway ops" href="/gateway" icon="terminal">
    Tiles are useful for dense secondary navigation.
  </Tile>
</TileGroup>

<Panel title="Reusable guidance">
Panels hold short reusable docs fragments without looking like alerts.
</Panel>

## Steps

<Steps>
  <Step title="Install OpenClaw">
    Run the installer and verify Node is available.

    \`\`\`sh
    curl -fsSL https://openclaw.ai/install.sh | bash
    \`\`\`
  </Step>
  <Step title="Run onboarding">
    Pair a channel and choose a model provider.
  </Step>
  <Step title="Verify the Gateway">
    Confirm the Gateway responds before adding more channels.
  </Step>
</Steps>

## Tabs

<Tabs>
  <Tab title="macOS / Linux">
    \`\`\`sh
    openclaw onboard
    \`\`\`
  </Tab>
  <Tab title="Windows">
    \`\`\`powershell
    openclaw.exe onboard
    \`\`\`
  </Tab>
</Tabs>

## Accordions

<AccordionGroup>
  <Accordion title="What should be visible?">
    Accordion summaries should be scannable, and their body text should not look like nested cards.
  </Accordion>
  <Expandable title="What can be expanded?">
    Expandables use the same quiet disclosure treatment as accordions.
  </Expandable>
  <Accordion title="What should stay quiet?">
    Long reference details should remain readable without stealing attention from the surrounding page.
  </Accordion>
</AccordionGroup>

## Parameters

<ParamField path="channels.telegram.groupPolicy" type="string" required>
Controls whether Telegram groups use allowlists, denylists, or open access.
</ParamField>

<ParamField path="channels.telegram.requireMention" type="boolean" default="true">
Controls whether group messages need to mention the agent before a reply is considered.
</ParamField>

<ParamField path="channels.telegram.accounts" type="record">
Defines multiple Telegram account profiles for the same Gateway.
</ParamField>

<Property name="session.status" type="enum" default="idle">
Property blocks share the parameter renderer for config, response, and schema details.
</Property>

<ResponseField name="ok" type="boolean" required>
Response fields use the same dense reference layout.
</ResponseField>

## Diagram

<Mermaid>
sequenceDiagram
  participant User
  participant Gateway
  User->>Gateway: openclaw status
  Gateway-->>User: healthy
</Mermaid>

## Frame

<Frame caption="OpenClaw docs frame">
  ![OpenClaw pixel lobster](/assets/pixel-lobster.svg)
</Frame>

## Table

| Surface | Purpose | Status |
| --- | --- | --- |
| R2 Pages | Static object deploy | Healthy |
| Docs Live Smoke | Production route probe | Healthy |
| Pages | Worker router validation | Manual deploy |
`;
