export const elementsFixture = `---
title: "Docs elements"
summary: "Hidden fixture page for docs shell visual QA."
---

# Docs elements

This hidden page exercises the docs shell renderer. It is not linked from navigation, the sitemap, or the docs index.

## Text and inline code

OpenClaw docs use compact developer prose with **strong emphasis**, [inline links](/start/getting-started), and inline code such as \`openclaw onboard\`, \`channels.telegram.enabled\`, and \`OPENCLAW_HOME\`.

> Blockquotes should stay quiet and readable without becoming callout boxes.

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

## Code

<CodeGroup>

\`\`\`sh
openclaw status --deep
openclaw gateway restart
curl -fsSL https://documentation.openclaw.ai/llms.txt
\`\`\`

\`\`\`json
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

## Cards

<CardGroup cols={2}>
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
  <Accordion title="What should stay quiet?">
    Long reference details should remain readable without stealing attention from the surrounding page.
  </Accordion>
</AccordionGroup>

## Parameters

<ParamField path="channels.telegram.groupPolicy" type="string" required>
Controls whether Telegram groups use allowlists, denylists, or open access.
</ParamField>

<ParamField path="channels.telegram.accounts" type="record">
Defines multiple Telegram account profiles for the same Gateway.
</ParamField>

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
