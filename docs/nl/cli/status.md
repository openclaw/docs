---
read_when:
    - Je wilt een snelle diagnose van de kanaalstatus + recente sessieontvangers
    - Je wilt een plakbare ‘alles’-status voor foutopsporing
summary: CLI-referentie voor `openclaw status` (diagnostiek, controlesondes, momentopnamen van gebruik)
title: Status
x-i18n:
    generated_at: "2026-05-05T06:16:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnostiek voor kanalen + sessies.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Opmerkingen:

- `--deep` voert liveprobes uit (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Gewoon `openclaw status` blijft op het snelle alleen-lezenpad en markeert geheugen als `not checked` in plaats van niet beschikbaar wanneer geheugeninspectie wordt overgeslagen. Zware beveiligingsaudit, Plugin-compatibiliteit en memory-vectorprobes blijven over voor `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` en `openclaw memory status --deep`.
- `status --json --all` rapporteert geheugendetails van de actieve runtime van de memory-Plugin die is geselecteerd door `plugins.slots.memory`. Aangepaste memory-Plugins kunnen ingebouwde `agents.defaults.memorySearch.enabled` uitgeschakeld laten en toch hun eigen bestanden, chunks, vector- en FTS-status rapporteren.
- `--usage` drukt genormaliseerde providergebruikvensters af als `X% left`.
- De uitvoer van sessiestatus scheidt `Execution:` van `Runtime:`. `Execution` is het sandboxpad (`direct`, `docker/*`), terwijl `Runtime` aangeeft of de sessie `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend zoals `codex (acp/acpx)` gebruikt. Zie [Agentruntimes](/nl/concepts/agent-runtimes) voor het onderscheid tussen provider/model/runtime.
- De ruwe velden `usage_percent` / `usagePercent` van MiniMax zijn resterend quotum, dus OpenClaw keert ze om voordat ze worden weergegeven; op telling gebaseerde velden krijgen voorrang wanneer ze aanwezig zijn. `model_remains`-antwoorden geven de voorkeur aan de chatmodelvermelding, leiden indien nodig het vensterlabel af uit tijdstempels en nemen de modelnaam op in het planlabel.
- Wanneer de huidige sessiesnapshot beperkt is, kan `/status` token- en cachetellers aanvullen vanuit het meest recente transcriptgebruikslog. Bestaande niet-nul livewaarden krijgen nog steeds voorrang op terugvalwaarden uit het transcript.
- `/status` bevat compacte Gateway-procesuptime en hostsysteemuptime.
- Transcriptterugval kan ook het actieve runtimemodellabel herstellen wanneer dit ontbreekt in de live sessievermelding. Als dat transcriptmodel verschilt van het geselecteerde model, lost status het contextvenster op tegen het herstelde runtimemodel in plaats van tegen het geselecteerde model.
- Voor promptgrootteboekhouding geeft transcriptterugval de voorkeur aan het grotere promptgerichte totaal wanneer sessiemetadata ontbreken of kleiner zijn, zodat sessies met aangepaste providers niet terugvallen naar tokenweergaven van `0`.
- De uitvoer bevat sessieopslag per agent wanneer meerdere agents zijn geconfigureerd.
- Overzicht bevat de installatie-/runtimestatus van Gateway + node-hostservice wanneer beschikbaar.
- Overzicht bevat updatekanaal + git-SHA (voor sourcecheckouts).
- Update-informatie verschijnt in het Overzicht; als er een update beschikbaar is, drukt status een hint af om `openclaw update` uit te voeren (zie [Bijwerken](/nl/install/updating)).
- Alleen-lezen-statusoppervlakken (`status`, `status --json`, `status --all`) lossen ondersteunde SecretRefs voor hun doelconfiguratiepaden op wanneer mogelijk.
- Als een ondersteunde SecretRef voor een kanaal is geconfigureerd maar niet beschikbaar is in het huidige commandopad, blijft status alleen-lezen en rapporteert gedegradeerde uitvoer in plaats van te crashen. Menselijke uitvoer toont waarschuwingen zoals “geconfigureerd token niet beschikbaar in dit commandopad”, en JSON-uitvoer bevat `secretDiagnostics`.
- Wanneer commandolokale SecretRef-resolutie slaagt, geeft status de voorkeur aan de opgeloste snapshot en wist het tijdelijke kanaalmarkeringen voor “secret niet beschikbaar” uit de uiteindelijke uitvoer.
- `status --all` bevat een overzichtsrij voor secrets en een diagnosesectie die secretdiagnostiek samenvat (afgekapt voor leesbaarheid) zonder het genereren van het rapport te stoppen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/gateway/doctor)
