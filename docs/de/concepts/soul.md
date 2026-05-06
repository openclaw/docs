---
read_when:
    - Sie möchten, dass Ihr Agent weniger generisch klingt
    - Sie bearbeiten SOUL.md
    - Sie möchten eine stärkere Persönlichkeit, ohne Sicherheit oder Kürze zu gefährden
summary: Verwenden Sie SOUL.md, um Ihrem OpenClaw-Agenten eine echte Stimme statt generischem Assistenten-Einheitsbrei zu geben.
title: SOUL.md-Persönlichkeitsleitfaden
x-i18n:
    generated_at: "2026-05-06T06:45:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` ist der Ort, an dem die Stimme Ihres Agenten lebt.

OpenClaw bindet sie in normalen Sitzungen ein, daher hat sie echtes Gewicht. Wenn Ihr Agent
fad, ausweichend oder seltsam nach Konzern klingt, ist dies meist die Datei, die Sie korrigieren sollten.

## Was in SOUL.md gehört

Nehmen Sie Dinge auf, die verändern, wie es sich anfühlt, mit dem Agenten zu sprechen:

- Ton
- Meinungen
- Kürze
- Humor
- Grenzen
- Standardmaß an Direktheit

Machen Sie daraus **nicht**:

- eine Lebensgeschichte
- ein Changelog
- einen Sicherheitsrichtlinien-Dump
- eine riesige Wand aus Stimmungen ohne Verhaltenswirkung

Kurz schlägt lang. Präzise schlägt vage.

## Warum das funktioniert

Das entspricht den Prompt-Richtlinien von OpenAI:

- Der Prompt-Engineering-Leitfaden sagt, dass Verhalten auf hoher Ebene, Ton, Ziele und
  Beispiele in die Anweisungsebene mit hoher Priorität gehören, nicht versteckt in der
  Benutzereingabe.
- Derselbe Leitfaden empfiehlt, Prompts wie etwas zu behandeln, das Sie iterieren,
  festschreiben und evaluieren, nicht wie magische Prosa, die Sie einmal schreiben und vergessen.

Für OpenClaw ist `SOUL.md` genau diese Ebene.

Wenn Sie mehr Persönlichkeit wollen, schreiben Sie stärkere Anweisungen. Wenn Sie stabile
Persönlichkeit wollen, halten Sie sie knapp und versioniert.

OpenAI-Referenzen:

- [Prompt Engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Nachrichtenrollen und Befolgen von Anweisungen](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Der Molty-Prompt

Fügen Sie dies in Ihren Agenten ein und lassen Sie ihn `SOUL.md` neu schreiben.

Pfad festgelegt für OpenClaw-Workspaces: Verwenden Sie `SOUL.md`, nicht `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Wie gut aussieht

Gute `SOUL.md`-Regeln klingen so:

- eine Haltung haben
- Fülltext weglassen
- witzig sein, wenn es passt
- schlechte Ideen früh benennen
- knapp bleiben, außer Tiefe ist wirklich nützlich

Schlechte `SOUL.md`-Regeln klingen so:

- jederzeit Professionalität wahren
- umfassende und durchdachte Unterstützung bieten
- eine positive und unterstützende Erfahrung sicherstellen

Mit dieser zweiten Liste bekommen Sie Brei.

## Eine Warnung

Persönlichkeit ist keine Erlaubnis, schlampig zu sein.

Behalten Sie `AGENTS.md` für Betriebsregeln. Behalten Sie `SOUL.md` für Stimme, Haltung und
Stil. Wenn Ihr Agent in gemeinsamen Kanälen, öffentlichen Antworten oder Kundenoberflächen
arbeitet, stellen Sie sicher, dass der Ton weiterhin zum Umfeld passt.

Scharf ist gut. Nervig ist es nicht.

## Verwandt

<CardGroup cols={2}>
  <Card title="Agent-Workspace" href="/de/concepts/agent-workspace" icon="folder-open">
    Workspace-Dateien, die OpenClaw in den System-Prompt einbindet.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie `SOUL.md` in den System-Prompt pro Runde zusammengesetzt wird.
  </Card>
  <Card title="SOUL.md-Vorlage" href="/de/reference/templates/SOUL" icon="file-lines">
    Startvorlage für eine Persönlichkeitsdatei.
  </Card>
</CardGroup>
