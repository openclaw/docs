---
read_when:
    - Je wilt een snelle diagnose van kanaalstatus + recente sessieontvangers
    - Je wilt een plakbare "all"-status voor foutopsporing
summary: CLI-referentie voor `openclaw status` (diagnostiek, controles, gebruiksmomentopnamen)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:06:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

Diagnostiek voor kanalen + sessies.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Opmerkingen:

- `--deep` voert live-controles uit (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Gewoon `openclaw status` blijft op het snelle alleen-lezen-pad en markeert geheugen als `not checked` in plaats van niet beschikbaar wanneer geheugeninspectie wordt overgeslagen. Zware beveiligingsaudit, Plugin-compatibiliteit en geheugen-vectorcontroles blijven voor `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` en `openclaw memory status --deep`.
- `status --json --all` rapporteert geheugendetails van de actieve geheugen-Plugin-runtime die is geselecteerd door `plugins.slots.memory`. Aangepaste geheugen-Plugins kunnen ingebouwde `agents.defaults.memorySearch.enabled` uitgeschakeld laten en toch hun eigen bestanden, chunks, vector- en FTS-status rapporteren.
- `--usage` drukt genormaliseerde provider-gebruiksvensters af als `X% left`.
- Sessiestatusuitvoer scheidt `Execution:` van `Runtime:`. `Execution` is het sandboxpad (`direct`, `docker/*`), terwijl `Runtime` aangeeft of de sessie `OpenClaw Pi Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend gebruikt, zoals `codex (acp/acpx)`. Zie [Agent-runtimes](/nl/concepts/agent-runtimes) voor het onderscheid tussen provider/model/runtime.
- MiniMax' ruwe velden `usage_percent` / `usagePercent` zijn resterend quotum, dus OpenClaw keert ze om vóór weergave; op telling gebaseerde velden winnen wanneer ze aanwezig zijn. `model_remains`-antwoorden geven de voorkeur aan de chatmodelvermelding, leiden waar nodig het vensterlabel af uit tijdstempels en nemen de modelnaam op in het planlabel.
- Wanneer de huidige sessiesnapshot beperkt is, kan `/status` token- en cachetellers aanvullen vanuit het meest recente transcriptgebruikslogboek. Bestaande niet-nul livewaarden winnen nog steeds van transcript-terugvalwaarden.
- `/status` bevat compacte uptime van het Gateway-proces en uptime van het hostsysteem.
- Transcript-terugval kan ook het actieve runtime-modellabel herstellen wanneer dit ontbreekt in de live sessievermelding. Als dat transcriptmodel afwijkt van het geselecteerde model, bepaalt status het contextvenster op basis van het herstelde runtimemodel in plaats van het geselecteerde model.
- Voor promptgrootteboekhouding geeft transcript-terugval de voorkeur aan het grotere promptgerichte totaal wanneer sessiemetadata ontbreken of kleiner zijn, zodat sessies met aangepaste providers niet instorten tot tokenweergaven van `0`.
- Uitvoer bevat sessiestores per agent wanneer meerdere agents zijn geconfigureerd.
- Overzicht bevat installatie-/runtimestatus van Gateway + node-hostservice wanneer beschikbaar.
- Overzicht bevat updatekanaal + git SHA (voor source-checkouts).
- Update-informatie verschijnt in het Overzicht; als er een update beschikbaar is, drukt status een hint af om `openclaw update` uit te voeren (zie [Bijwerken](/nl/install/updating)).
- Alleen-lezen-statusoppervlakken (`status`, `status --json`, `status --all`) lossen ondersteunde SecretRefs voor hun gerichte configuratiepaden op waar mogelijk.
- Als een ondersteunde kanaal-SecretRef is geconfigureerd maar niet beschikbaar is in het huidige opdrachtpad, blijft status alleen-lezen en rapporteert gedegradeerde uitvoer in plaats van te crashen. Menselijke uitvoer toont waarschuwingen zoals "configured token unavailable in this command path", en JSON-uitvoer bevat `secretDiagnostics`.
- Wanneer opdrachtlokale SecretRef-oplossing slaagt, geeft status de voorkeur aan de opgeloste snapshot en wist tijdelijke kanaalmarkeringen voor "secret unavailable" uit de uiteindelijke uitvoer.
- `status --all` bevat een overzichtsrij voor Secrets en een diagnosesectie die geheime diagnostiek samenvat (afgekapt voor leesbaarheid) zonder rapportgeneratie te stoppen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/gateway/doctor)
