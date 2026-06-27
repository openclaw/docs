---
read_when:
    - Je wilt een snelle diagnose van kanaalgezondheid + recente sessieontvangers
    - Je wilt een plakbare status "alles" voor debuggen
summary: CLI-referentie voor `openclaw status` (diagnostiek, sondes, gebruikssnapshots)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:23:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
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

- `--deep` voert live probes uit (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Gewone `openclaw status` blijft op het snelle alleen-lezen pad en markeert geheugen als `not checked` in plaats van niet beschikbaar wanneer geheugeninspectie wordt overgeslagen. Zware beveiligingsaudit, Plugin-compatibiliteit en geheugen-vectorprobes worden overgelaten aan `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` en `openclaw memory status --deep`.
- `status --json --all` rapporteert geheugendetails van de actieve geheugen-Plugin-runtime die is geselecteerd door `plugins.slots.memory`. Aangepaste geheugen-Plugins kunnen ingebouwde `agents.defaults.memorySearch.enabled` uitgeschakeld laten en nog steeds hun eigen bestanden, chunks, vector- en FTS-status rapporteren.
- `--usage` drukt genormaliseerde gebruiksvensters van providers af als `X% left`.
- Sessiestatusuitvoer scheidt `Execution:` van `Runtime:`. `Execution` is het sandboxpad (`direct`, `docker/*`), terwijl `Runtime` aangeeft of de sessie `OpenClaw Default`, `OpenAI Codex`, een CLI-backend of een ACP-backend gebruikt, zoals `codex (acp/acpx)`. Zie [Agent-runtimes](/nl/concepts/agent-runtimes) voor het onderscheid tussen provider/model/runtime.
- De ruwe velden `usage_percent` / `usagePercent` van MiniMax zijn resterend quotum, dus OpenClaw keert ze om vóór weergave; op aantallen gebaseerde velden winnen wanneer ze aanwezig zijn. `model_remains`-antwoorden geven de voorkeur aan de chat-modelvermelding, leiden waar nodig het vensterlabel af uit tijdstempels en nemen de modelnaam op in het abonnementlabel.
- Wanneer de huidige sessiesnapshot beperkt is, kan `/status` token- en cachetellers aanvullen vanuit het meest recente gebruikslogboek van het transcript. Bestaande niet-nul livewaarden winnen nog steeds van transcript-fallbackwaarden.
- `/status` bevat compacte uptime van het Gateway-proces en uptime van het hostsysteem.
- Transcript-fallback kan ook het actieve runtime-modellabel herstellen wanneer dit ontbreekt in de live sessievermelding. Als dat transcriptmodel verschilt van het geselecteerde model, lost status het contextvenster op tegen het herstelde runtime-model in plaats van tegen het geselecteerde model.
- Wanneer een sessie is vastgezet op een model dat verschilt van de geconfigureerde primaire keuze, drukt status beide waarden af, de reden (`session override`) en de duidelijke hint (`/model default`). De geconfigureerde primaire keuze geldt voor nieuwe of niet-vastgezette sessies; bestaande vastgezette sessies behouden hun sessieselectie totdat die wordt gewist.
- Voor promptgrootteboekhouding geeft transcript-fallback de voorkeur aan het grotere promptgerichte totaal wanneer sessiemetadata ontbreken of kleiner zijn, zodat sessies met aangepaste providers niet terugvallen naar tokenweergaven van `0`.
- Uitvoer bevat sessiestores per agent wanneer meerdere agents zijn geconfigureerd.
- Het overzicht bevat de installatie-/runtimestatus van Gateway + node-hostservice wanneer beschikbaar.
- Het overzicht bevat updatekanaal + git SHA (voor source checkouts).
- Update-informatie verschijnt in het overzicht; als er een update beschikbaar is, drukt status een hint af om `openclaw update` uit te voeren (zie [Bijwerken](/nl/install/updating)).
- Mislukte vernieuwingen van modelprijzen worden weergegeven als optionele prijswaarschuwingen. Ze betekenen
  niet dat de Gateway of kanalen ongezond zijn.
- Alleen-lezen statussurfaces (`status`, `status --json`, `status --all`) lossen ondersteunde SecretRefs waar mogelijk op voor hun doelconfiguratiepaden.
- Als een ondersteunde kanaal-SecretRef is geconfigureerd maar niet beschikbaar is in het huidige commandopad, blijft status alleen-lezen en rapporteert het gedegradeerde uitvoer in plaats van te crashen. Menselijke uitvoer toont waarschuwingen zoals "configured token unavailable in this command path", en JSON-uitvoer bevat `secretDiagnostics`.
- Wanneer commandolokale SecretRef-resolutie slaagt, geeft status de voorkeur aan de opgeloste snapshot en wist het tijdelijke kanaalmarkeringen voor "secret unavailable" uit de uiteindelijke uitvoer.
- `status --all` bevat een overzichtsrij voor Secrets en een diagnosesectie die geheime-diagnostiek samenvat (afgekapt voor leesbaarheid) zonder het genereren van het rapport te stoppen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/gateway/doctor)
