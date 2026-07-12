---
read_when:
    - Je wilt een snelle diagnose van de kanaalstatus en de ontvangers van recente sessies
    - Je wilt een plakbare 'alles'-status voor foutopsporing
summary: CLI-referentie voor `openclaw status` (diagnostiek, controles, gebruiksmomentopnamen)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T08:43:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnostiek voor kanalen en sessies.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Vlag                    | Beschrijving                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Volledige diagnose (alleen-lezen, geschikt om te plakken). Omvat beveiligingscontrole, plugincompatibiliteit en geheugenvectorcontroles. |
| `--deep`                | Voert livecontroles uit (WhatsApp Web + Telegram + Discord + Slack + Signal). Schakelt ook de beveiligingscontrole in.     |
| `--usage`               | Toont genormaliseerde gebruiksvensters van providers als `X% resterend`.                                                  |
| `--json`                | Machineleesbare uitvoer.                                                                                                  |
| `--verbose` / `--debug` | Toont vóór het rapport ook de onbewerkte bepaling van het Gateway-doel.                                                    |

Gewoon `openclaw status` blijft op het snelle alleen-lezenpad en markeert het geheugen als
`niet gecontroleerd` in plaats van niet beschikbaar wanneer de geheugeninspectie wordt overgeslagen. Zware
beveiligingscontroles, plugincompatibiliteitscontroles en geheugenvectorcontroles worden overgelaten aan
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
en `openclaw memory status --deep`.

## Sessie- en modelbepaling

- De sessiestatusuitvoer maakt onderscheid tussen `Uitvoering:` en `Runtime:`. `Uitvoering`
  is het sandboxpad (`direct`, `docker/*`), terwijl `Runtime` aangeeft
  of de sessie `OpenClaw Default`, `OpenAI Codex`, een CLI-
  backend of een ACP-backend zoals `codex (acp/acpx)` gebruikt. Zie
  [Agentruntimes](/nl/concepts/agent-runtimes) voor het onderscheid tussen
  provider, model en runtime.
- Wanneer de huidige sessiemomentopname weinig gegevens bevat, kan `/status` token-
  en cachetellers aanvullen vanuit het meest recente gebruikslogboek van het transcript. Bestaande
  niet-nulle livewaarden hebben nog steeds voorrang op terugvalwaarden uit het transcript.
- Terugval op het transcript kan ook het label van het actieve runtimemodel herstellen wanneer
  dit ontbreekt in de live-sessievermelding. Als dat transcriptmodel afwijkt
  van het geselecteerde model, bepaalt de status het contextvenster aan de hand van het
  herstelde runtimemodel in plaats van het geselecteerde model.
- Voor de berekening van de promptgrootte geeft terugval op het transcript de voorkeur aan het grotere
  promptgerichte totaal wanneer sessiemetagegevens ontbreken of kleiner zijn, zodat
  sessies van aangepaste providers niet terugvallen naar een tokenweergave van `0`.
- Wanneer een sessie is vastgezet op een model dat afwijkt van het geconfigureerde
  primaire model, toont de status beide waarden, de reden (`sessieoverschrijving`) en
  de hint `/model default`. Het geconfigureerde primaire model geldt voor nieuwe of
  niet-vastgezette sessies; bestaande vastgezette sessies behouden hun sessieselectie
  totdat deze wordt gewist.
- De uitvoer bevat sessieopslag per agent wanneer meerdere agenten zijn
  geconfigureerd.

## Gebruik en quotum

- `--usage` toont genormaliseerde gebruiksvensters van providers als `X% resterend`.
- De onbewerkte velden `usage_percent` / `usagePercent` van MiniMax geven het resterende quotum aan,
  dus OpenClaw keert ze vóór de weergave om; op aantallen gebaseerde velden hebben voorrang wanneer
  deze aanwezig zijn. Antwoorden met `model_remains` geven de voorkeur aan de vermelding voor het chatmodel, leiden indien nodig het
  vensterlabel af van tijdstempels en nemen de modelnaam op in
  het planlabel.
- Mislukte vernieuwingen van modelprijzen worden weergegeven als optionele prijswaarschuwingen.
  Ze betekenen niet dat de Gateway of kanalen niet goed functioneren.

## Overzicht en updatestatus

- Het overzicht bevat, indien beschikbaar, de installatie- en runtimestatus van de Gateway en de hostservice van de Node,
  plus een compacte bedrijfstijd van het Gateway-proces en de bedrijfstijd van het hostsysteem.
- Het overzicht bevat het updatekanaal en de git-SHA (voor broncodecheck-outs).
- Update-informatie wordt weergegeven in het overzicht; als er een update beschikbaar is, toont de status
  een hint om `openclaw update` uit te voeren (zie [Bijwerken](/nl/install/updating)).

## Geheimen

- Alleen-lezenstatusoppervlakken (`status`, `status --json`, `status --all`)
  verwerken waar mogelijk ondersteunde SecretRefs voor de betreffende configuratiepaden.
- Als een ondersteunde SecretRef voor een kanaal is geconfigureerd maar niet beschikbaar is in het
  huidige opdrachtpad, blijft de status alleen-lezen en rapporteert deze beperkte uitvoer
  in plaats van vast te lopen. Menselijk leesbare uitvoer toont waarschuwingen zoals "geconfigureerd token
  niet beschikbaar in dit opdrachtpad", en JSON-uitvoer bevat
  `secretDiagnostics`.
- Wanneer lokale SecretRef-verwerking voor de opdracht slaagt, geeft de status de voorkeur aan de
  verwerkte momentopname en verwijdert deze tijdelijke kanaalmarkeringen voor "geheim niet beschikbaar"
  uit de uiteindelijke uitvoer.
- `status --all` bevat een overzichtsrij voor geheimen en een diagnosesectie
  die de diagnostiek voor geheimen samenvat (ingekort voor de leesbaarheid) zonder
  het genereren van het rapport te stoppen.

## Geheugen

`status --json --all` rapporteert geheugendetails vanuit de runtime van de actieve geheugenplugin
die door `plugins.slots.memory` is geselecteerd. Aangepaste geheugenplugins kunnen
de ingebouwde instelling `agents.defaults.memorySearch.enabled` uitgeschakeld laten en toch
hun eigen bestanden, fragmenten, vector- en FTS-status rapporteren.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Doctor](/nl/gateway/doctor)
