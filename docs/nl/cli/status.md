---
read_when:
    - Je wilt een snelle diagnose van de kanaalstatus + recente sessieontvangers
    - Je wilt een plakbare status “alles” voor foutopsporing
summary: CLI-referentie voor `openclaw status` (diagnostiek, probes, gebruikssnapshots)
title: Status
x-i18n:
    generated_at: "2026-04-29T22:35:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
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
- Gewoon `openclaw status` blijft op het snelle alleen-lezenpad en markeert geheugen als `not checked` in plaats van onbeschikbaar wanneer geheugeninspectie wordt overgeslagen. Zware beveiligingsaudit-, Plugin-compatibiliteits- en geheugenvectorprobes blijven voor `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` en `openclaw memory status --deep`.
- `status --json --all` rapporteert geheugendetails van de actieve geheugen-Plugin-runtime die is geselecteerd door `plugins.slots.memory`. Aangepaste geheugen-Plugins kunnen ingebouwde `agents.defaults.memorySearch.enabled` uitgeschakeld laten en toch hun eigen bestanden, segmenten, vector- en FTS-status rapporteren.
- `--usage` drukt genormaliseerde gebruiksvensters van providers af als `X% left`.
- Sessiestatusuitvoer scheidt `Execution:` van `Runtime:`. `Execution` is het sandboxpad (`direct`, `docker/*`), terwijl `Runtime` aangeeft of de sessie `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend zoals `codex (acp/acpx)` gebruikt. Zie [Agent-runtimes](/nl/concepts/agent-runtimes) voor het onderscheid tussen provider/model/runtime.
- De ruwe velden `usage_percent` / `usagePercent` van MiniMax zijn resterend quotum, dus OpenClaw keert ze om vóór weergave; op aantallen gebaseerde velden winnen wanneer ze aanwezig zijn. `model_remains`-antwoorden geven de voorkeur aan de chatmodelvermelding, leiden indien nodig het vensterlabel af uit tijdstempels en nemen de modelnaam op in het abonnementlabel.
- Wanneer de momentopname van de huidige sessie beperkt is, kan `/status` token- en cachetellers aanvullen vanuit het meest recente transcriptgebruikslogboek. Bestaande livewaarden die niet nul zijn, winnen nog steeds van transcript-terugvalwaarden.
- Transcript-terugval kan ook het actieve runtime-modellabel herstellen wanneer dit ontbreekt in de live sessievermelding. Als dat transcriptmodel afwijkt van het geselecteerde model, bepaalt status het contextvenster op basis van het herstelde runtimemodel in plaats van het geselecteerde model.
- Voor promptgrootteboekhouding geeft transcript-terugval de voorkeur aan het grotere promptgerichte totaal wanneer sessiemetadata ontbreken of kleiner zijn, zodat sessies van aangepaste providers niet terugvallen naar tokenweergaven van `0`.
- Uitvoer bevat sessiestores per agent wanneer meerdere agents zijn geconfigureerd.
- Overzicht bevat Gateway + install/runtime-status van node-hostservice wanneer beschikbaar.
- Overzicht bevat updatekanaal + git-SHA (voor broncheckouts).
- Update-informatie verschijnt in het Overzicht; als er een update beschikbaar is, drukt status een hint af om `openclaw update` uit te voeren (zie [Bijwerken](/nl/install/updating)).
- Alleen-lezen statusoppervlakken (`status`, `status --json`, `status --all`) lossen ondersteunde SecretRefs voor hun doelconfiguratiepaden op wanneer mogelijk.
- Als een ondersteunde kanaal-SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, blijft status alleen-lezen en rapporteert gedegradeerde uitvoer in plaats van te crashen. Menselijke uitvoer toont waarschuwingen zoals “geconfigureerd token niet beschikbaar in dit commandopad”, en JSON-uitvoer bevat `secretDiagnostics`.
- Wanneer commandolokale SecretRef-resolutie slaagt, geeft status de voorkeur aan de opgeloste momentopname en wist tijdelijke kanaalmarkeringen voor “secret niet beschikbaar” uit de uiteindelijke uitvoer.
- `status --all` bevat een overzichtsrij voor Secrets en een diagnosesectie die secretdiagnostiek samenvat (ingekort voor leesbaarheid) zonder rapportgeneratie te stoppen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/gateway/doctor)
