---
read_when:
    - Je wilt een korte aanvullende vraag stellen over de huidige sessie
    - Je implementeert of debugt BTW-gedrag in verschillende clients
summary: Tijdelijke tussenvragen met /btw
title: Trouwens, tussendoorvragen
x-i18n:
    generated_at: "2026-07-16T16:29:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (alias `/side`) stelt een korte tussenvraag over de **huidige
sessie** zonder deze aan de gespreksgeschiedenis toe te voegen. Het is gemodelleerd naar
`/btw` van Claude Code en aangepast aan de Gateway- en multikanaalsarchitectuur
van OpenClaw.

```text
/btw wat is er veranderd?
/side wat betekent deze fout?
```

## Wat het doet

1. Maakt een momentopname van de huidige sessie als achtergrondcontext (inclusief een
   eventueel actieve prompt van de hoofdtaak).
2. Voert een afzonderlijke, eenmalige tussenvraag uit met de instructie aan het model om alleen
   de tussenvraag te beantwoorden en de hoofdtaak niet te hervatten of bij te sturen.
3. Levert het antwoord als een live tussenresultaat, niet als een normaal assistentbericht.
4. Schrijft de vraag of het antwoord nooit naar de sessiegeschiedenis of `chat.history`.

De hoofdtaak blijft onaangeroerd als die actief is.

Voor Codex-harnesssessies maakt BTW een fork van de actieve Codex-app-serverthread naar
een tijdelijke child-thread, in plaats van een afzonderlijke provideraanroep uit te voeren. Zo
blijven Codex OAuth en het native gedrag van tools en threads intact, en behoudt de geforkte
thread het huidige goedkeuringsbeleid, de sandbox en het native
tooloppervlak van de parent-thread. De geforkte thread krijgt een grensprompt die het model vertelt dat
alles daarvoor overgeërfde referentiecontext is, geen actieve instructies,
en dat alleen berichten na de grens actief zijn. `/btw` vereist een
bestaande Codex-thread; stuur eerst een normaal bericht.

Voor CLI-runtime-aliassen roept BTW de verantwoordelijke CLI-backend aan in eenmalige
tussenvraagmodus: het voegt opgeschoonde gesprekscontext toe aan een nieuwe CLI-
aanroep, waarbij bundeling van tools en herbruikbare sessiestatus zijn uitgeschakeld, en voegt
alle door de backend ondersteunde vlaggen voor niet-hervatten en geen-tools toe. Directe runtimes
(zonder CLI) gebruiken in plaats daarvan een directe, eenmalige provideraanroep.

## Wat het niet doet

`/btw` maakt geen duurzame sessie, zet de onvoltooide hoofdtaak niet voort,
slaat vraag- of antwoordgegevens niet op in de transcriptgeschiedenis en blijft niet bestaan na opnieuw laden.

## Leveringsmodel

Normale assistentchat gebruikt de Gateway-gebeurtenis `chat`. BTW gebruikt een afzonderlijke
gebeurtenis `chat.side_result`, zodat clients deze niet kunnen verwarren met de normale
gespreksgeschiedenis. Omdat deze niet opnieuw wordt afgespeeld vanuit `chat.history`,
verdwijnt deze na opnieuw laden.

## Gedrag per interface

| Interface         | Gedrag                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Inline weergegeven in het chatlogboek, duidelijk te onderscheiden van een normaal antwoord en te sluiten met `Enter` of `Esc`.                                                                                                                                                |
| Externe kanalen   | Geleverd als een duidelijk gelabeld, eenmalig antwoord (Telegram, WhatsApp en Discord hebben geen lokale tijdelijke overlay).                                                                                                                                                        |
| Control UI / web  | Weergegeven als een zwevend paneel 'Zijchat' dat aan de thread is vastgemaakt. Antwoorden stapelen zich op als beurten en via een invoerveld 'Vervolgvraag' stel je de volgende tussenvraag. Sluiten (`Esc` of de X) bewaart het gesprek, dat bij het volgende antwoord weer wordt geopend; de prullenbakknop verwijdert het en stopt een lopende uitvoering. |

## Selectiepop-up (Control UI)

Wanneer je tekst in een chatbericht in de Control UI markeert, wordt een kleine
selectiepop-up met twee acties geopend:

- **Meer details** verstuurt onmiddellijk een impliciete vraag via `/btw` waarin het
  model wordt gevraagd de gemarkeerde tekst uit te leggen in de context van de huidige
  sessie. Het antwoord verschijnt in het zwevende zijchatpaneel.
- **Vraag in zijchat** vult het invoerveld vooraf in met een concept via `/btw` waarin de
  gemarkeerde tekst wordt geciteerd, zodat je er je eigen vraag over kunt typen.

Beide acties volgen de normale semantiek van `/btw`: de vraag en het antwoord blijven buiten
de sessiegeschiedenis en de hoofdtaak blijft onaangeroerd.

## Wanneer je het gebruikt

Gebruik `/btw` voor een snelle verduidelijking, een feitelijk antwoord op een tussenvraag terwijl een lange taak
nog wordt uitgevoerd, of een tijdelijk antwoord dat niet in de toekomstige
sessiecontext terecht mag komen.

```text
/btw welk bestand bewerken we?
/btw vat de huidige taak in één zin samen
/btw wat is 17 * 19?
```

Voor alles wat je onderdeel wilt maken van de toekomstige werkcontext van de
sessie, stel je de vraag in plaats daarvan op de normale manier in de hoofdsessie.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Slash-opdrachten" href="/nl/tools/slash-commands" icon="terminal">
    Catalogus met native opdrachten en chatrichtlijnen.
  </Card>
  <Card title="Denkniveaus" href="/nl/tools/thinking" icon="brain">
    Redeneerinspanningsniveaus voor de modelaanroep van de tussenvraag.
  </Card>
  <Card title="Sessie" href="/nl/concepts/session" icon="comments">
    Sessiesleutels, geschiedenis en semantiek van persistentie.
  </Card>
  <Card title="Bijstuuropdracht" href="/nl/tools/steer" icon="arrow-right">
    Voeg een bijsturingsbericht toe aan de actieve taak zonder deze te beëindigen.
  </Card>
</CardGroup>
