---
read_when:
    - Prüfung, warum das Kanal-Ingress-Refactoring zu viel Code hinzugefügt hat
    - Verschieben von Richtlinien für Routen, Befehle, Ereignisse, Aktivierungen oder Zugriffsgruppen aus gebündelten Plugins in den Core
    - Überprüfung, ob eine Ingress-Hilfsfunktion für Kanäle tatsächlich Code gebündelter Plugins löscht
sidebarTitle: Ingress core deletion
summary: Plan mit Löschung zuerst für die Verlagerung wiederholter Kanaleingangs-Verbindungslogik in den Kern.
title: Plan zur Löschung des Ingress-Kerns
x-i18n:
    generated_at: "2026-05-12T01:01:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Löschplan für den Ingress-Kern

Das Ingress-Refactoring ist nicht gesund, solange es netto Tausende Zeilen hinzufügt. Kernzentralisierung zählt nur, wenn der Produktionscode gebündelter Plugins kleiner wird und alte SDK-Kompatibilität für Drittanbieter auf SDK-/Core-Shims beschränkt wird.

Gewünschte Laufzeitstruktur:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Gebündelte Plugins sollten Ingress nicht wieder in lokale Formen wie `AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` oder `{ allowed, reasonCode }` übersetzen, sofern dieser Typ keine öffentliche Plugin-API ist.

## Budget

Gemessen gegen die PR-Merge-Base mit `origin/main`, einschließlich nicht nachverfolgter Dateien.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Verbleibende Mindestbereinigung:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Das Löschen reiner Kommentare zählt nicht als Bereinigung. Der vorherige Budgetdurchlauf war zu großzügig, weil er wiederhergestellte erklärende QQBot-Kommentare einbezogen hat; dieses Dokument verfolgt nur Verschiebungen von ausführbarem Code, Dokumentation und Testcode.

Nach jeder Bereinigungswelle erneut messen:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnose

Der erste Durchlauf fügte den gemeinsamen Ingress-Kernel hinzu, ließ dann aber zu viel Plugin-lokale Autorisierung daneben bestehen:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Das dupliziert das Modell. Die Core-Produktion ist um etwa 3.376 Zeilen gewachsen, während die Produktion gebündelter Plugins 1.240 Zeilen kleiner ist. Das ist besser als im ersten Durchlauf, liegt aber nicht innerhalb des Mindestbudgets. Die Lösung bleibt löschungsorientiert:

- Plugin-DTOs löschen, die nur Ingress-Felder umbenennen
- Tests löschen, die nur Wrapper-Formen prüfen
- Core-Helfer nur hinzufügen, wenn derselbe Patch Code gebündelter Plugins löscht
- alte SDK-Kompatibilität nur in SDK-/Core-Shims halten
- Core neu packen, nachdem das Löschen der Wrapper die stabile Form freilegt

## Hotspots

Positive gebündelte Produktionsdateien, die noch schrumpfen müssen:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Der Branch liegt noch nicht innerhalb des Mindestbudgets. Die verbleibende review-relevante Arbeit sollte wiederholte Autorisierungsflüsse, Turn-Gerüstcode oder Wrapper-Tests löschen, bevor eine weitere Core-Abstraktion hinzugefügt wird.

## Aktueller Code-Stand

Der gesunde Core-Übergang existiert bereits in `src/channels/message-access/runtime.ts`: Er besitzt Identitätsadapter, effektive Allowlists, Pairing-Store-Lesezugriffe, Routendeskriptoren, Command-/Event-Presets, Zugriffsgruppen und die endgültig aufgelöste Projektion `ResolvedChannelMessageIngress`.

Das verbleibende Wachstum besteht größtenteils aus Plugin-Klebstoffcode, der auf diesem Übergang liegt:

- `extensions/telegram/src/ingress.ts` kapselt Core-Entscheidungen in Telegram-spezifische Command-/Event-Helfer, während Aufrufstellen weiterhin vorab berechnete normalisierte Allowlists und Owner-Listen übergeben.
- `extensions/discord/src/monitor/dm-command-auth.ts`, `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts` und `extensions/matrix/src/matrix/monitor/access-state.ts` halten weiterhin lokale Policy-DTOs oder alte Entscheidungsnamen neben Ingress.
- `extensions/signal/src/monitor/access-policy.ts` hält Signal-Identitätsnormalisierung und Pairing-Antworten korrekt lokal, hat aber weiterhin einen Wrapper-Übergang, der in direkte Ingress-Nutzung zusammenfallen sollte.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`, `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` und `extensions/zalouser/src/monitor.ts` wiederholen weiterhin Routen-/Envelope-/Turn-Zusammenbau, der in gemeinsame Turn-Helfer außerhalb des Ingress-Kernels verschoben werden kann.

Fazit: Mehr Code in den Core zu verschieben ist nur sinnvoll, wenn dadurch dieselben Plugin-Wrapper-Schichten im selben Patch gelöscht werden. Eine weitere Abstraktion hinzuzufügen, während Wrapper-Rückgaben bestehen bleiben, wiederholt den Fehler.

## Grenze

Core besitzt generische Policy:

- Allowlist-Normalisierung und -Abgleich
- Erweiterung und Diagnose von Zugriffsgruppen
- Pairing-Store-DM-Allowlist-Lesezugriffe
- Routen-, Sender-, Command-, Event- und Aktivierungs-Gates
- Zulassungszuordnung: Dispatch, Drop, Skip, Observe, Pairing
- redigierter Zustand, Entscheidungen, Diagnosen und SDK-Kompatibilitätsprojektionen
- wiederverwendbare generische Deskriptoren für Identität, Route, Command, Event, Aktivierung und Ergebnisse

Plugins besitzen Transportfakten und Seiteneffekte:

- Authentizität von Webhook, Socket und Request
- Extraktion von Plattformidentitäten und API-Lookups
- channelspezifische Policy-Defaults
- Zustellung von Pairing-Challenges, Antworten, Acks, Reaktionen, Typing, Medien, Verlauf, Einrichtung, Doctor, Status, Logs und nutzerseitige Texte

Core muss channel-agnostisch bleiben: kein Discord, Slack, Telegram, Matrix, Room, Guild, Space, API-Client oder Plugin-spezifischer Default in `src/channels/message-access`.

## Akzeptanzregel

Jeder neue Core-Helfer muss sofort Produktionscode gebündelter Plugins löschen.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Stoppen und neu entwerfen, wenn:

- die Plugin-Produktions-LOC steigt
- Tests schneller wachsen, als Produktion schrumpft
- ein gebündelter Hot Path ein DTO zurückgibt, das nur `ResolvedChannelMessageIngress` umbenennt
- ein Core-Helfer eine Channel-ID, ein Plattformobjekt, einen API-Client oder einen channelspezifischen Default benötigt

## Arbeitspakete

1. Das Budget einfrieren.
   LOC im PR festhalten, Deprecated-Ingress-Lint grün halten und Vorher-/Nachher-LOC in Bereinigungs-Commits aufnehmen.

2. Dünne DTO-Übergänge löschen.
   Plugin-lokale Wrapper-Rückgaben direkt durch `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess` oder `ingress` ersetzen. Mit QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage und Tlon beginnen. Wrapper-Form-Tests löschen; Verhaltenstests beibehalten.

3. Ergebnisklassifikation nur mit Löschungen hinzufügen.
   Ein generischer Klassifikator kann `dispatch`, `pairing-required`, `skip-activation`, `drop-command`, `drop-route`, `drop-sender` und `drop-ingress` bereitstellen. Er muss aus dem Entscheidungsgraphen abgeleitet werden, nicht aus Reason-Strings, und mindestens drei Plugins im selben Patch migrieren.

4. Routendeskriptor-Builder nur mit Löschungen hinzufügen.
   Generische Helfer für Routenziel und Routensender sind nur akzeptabel, wenn sie routenlastige Plugins sofort verkleinern: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo und Zalo Personal.

5. Command-/Event-Presets nur mit Löschungen hinzufügen.
   Formen für Text-Command, Native-Command, Callback und Origin-Subject zentralisieren. Command-Nutzer müssen standardmäßig auf nicht autorisiert fallen, wenn kein Command-Gate ausgeführt wurde; Events dürfen kein Pairing starten.

6. Identitäts-Presets nur dort hinzufügen, wo sie Boilerplate entfernen.
   Helfer für stabile ID, stabile ID plus Aliasse, phone/e164 und mehrere Identifier sind erlaubt, wenn Rohwerte nur in Adapter-Eingaben gelangen und der redigierte Zustand opake IDs/Zählwerte behält.

7. Autorisierten Turn-Zusammenbau teilen.
   Außerhalb des Ingress-Kernels wiederholten Routen-/Session-/Envelope-/Context-/Reply-Gerüstcode aus QA Channel, IRC, Nextcloud Talk, Zalo und Zalo Personal entfernen. Core kann Routen-/Session-/Envelope-/Dispatch-Sequenzierung besitzen; Plugins behalten Zustellung und channelspezifischen Kontext.

8. Kompatibilität isolieren.
   Veraltete SDK-Helfer bleiben quellkompatibel, aber gebündelte Hot Paths dürfen keine veralteten Ingress- oder Command-Auth-Fassaden importieren. Kompatibilitätstests sollten gefälschte Drittanbieter-Plugins verwenden, keine Interna gebündelter Plugins.

9. Core neu packen.
   Nach dem Löschen von Wrappern Einmalmodule zusammenführen, ungenutzte Exporte entfernen, Kompatibilitätsprojektion aus Hot Paths herausverschieben und fokussierte Tests für Identität, Route, Command/Event, Aktivierung, Zugriffsgruppen und Kompatibilitäts-Shims behalten.

## Löschwellen

Diese in Reihenfolge ausführen. Jede Welle muss die LOC gebündelter Produktion senken.

1. Wrapper zusammenführen, erwartetes Plugin-Delta: -400 bis -600.
   Plugin-lokale `resolveXAccess`-, `resolveXCommandAccess`- und `accessFromIngress`-Ergebnistypen durch direkte Lesezugriffe aus `ResolvedChannelMessageIngress` ersetzen. Erste Ziele: Discord-DM-Command-Auth, Feishu-Policy, Matrix-Zugriffszustand, Telegram-Ingress, Signal-Zugriffs-Policy, QQBot-SDK-Adapter.

2. Gemeinsame Ergebnishelfer, erwartetes Plugin-Delta: -200 bis -350.
   Einen generischen Klassifikator nur hinzufügen, wenn er wiederholte `shouldBlockControlCommand`-, Pairing-, Aktivierungs-Skip-, Routenblock- und Senderblock-Verzweigungen über mindestens drei Plugins hinweg löscht.

3. Routendeskriptor-Builder, erwartetes Plugin-Delta: -200 bis -350.
   Wiederholten Zusammenbau von Routenziel- und Routensender-Deskriptoren in Core-Helfer verschieben. Erste Ziele: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Turn-Zusammenbau teilen, erwartetes Plugin-Delta: -250 bis -450.
   Gemeinsame Routen-/Session-/Envelope-/Dispatch-Sequenzierung für einfache eingehende Plugins verwenden. Erste Ziele: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Core neu packen, erwartetes Core-Delta: -300 bis -700.
   Nachdem Plugins Laufzeitprojektionen direkt nutzen, Einmalmodule löschen, kleine Dateien wieder in `runtime.ts` oder fokussierte Geschwisterdateien zusammenführen und SDK-Kompatibilitätsdateien von gebündelten Hot Paths getrennt halten.

6. Tests ausdünnen, erwartetes Test-Delta: -300 bis -600.
   Tests löschen, die nur entfernte Wrapper-Formen prüfen. Verhaltenstests für Command-Ablehnung, Gruppen-Fallback, Origin-Subject-Abgleich, Aktivierungs-Skip, Zugriffsgruppen, Pairing und Redaktion beibehalten.

Erwartete Mindestform fürs Landing nach diesen Wellen:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Nicht verschieben

Verschieben Sie keine Plattform-Konfigurationsvorgaben, Setup-UX, doctor/fix-Texte, API-Lookups,
Slack-Prüfungen auf Owner-Präsenz, Matrix-Alias-/Verifizierungsbehandlung, Telegram-
Callback-Parsing, Befehlssyntax-Parsing, native Befehlsregistrierung, Reaktions-
Payload-Parsing, Pairing-Antworten, Befehlsantworten, Acks, Typing, Medien, Verlauf
oder Logs.

## Verifizierung

Gezielter lokaler Durchlauf:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Verwenden Sie Testbox für breite Changed-Gates/Full-Suite-Nachweise, sobald der LOC-Trend
im Budget liegt.

Jedes Arbeitspaket dokumentiert:

- LOC vor/nach nach Kategorie
- gelöschte Plugin-Wrapper
- neue Core-Helper-LOC, falls vorhanden
- ausgeführte gezielte Tests
- verbleibende Hotspot-Liste

## Abnahmekriterien

- gebündelte Produktions-Imports verwenden keine veralteten channel-access- oder command-auth-Fassaden
- Kompatibilitätscode ist auf SDK-/Core-Schnittstellen isoliert
- gebündelte Plugins konsumieren Ingress-Projektionen oder generische Ergebnisse direkt
- Plugin-Produktions-LOC sind gegenüber `origin/main` netto mindestens 1.500 negativ
- Core-Produktions-LOC sind `<= +1,500`, oder jeder Überschuss wird ausgeglichen, während die Summe
  `<= +2,000` bleibt
- repräsentative Tests decken Redaction, Route, Befehl/Event, Aktivierung,
  Access Group und channelspezifisches Fallback-Verhalten ab
