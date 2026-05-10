---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-10T19:29:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Packs und kompatible Bundles.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Manage plugins" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflistung, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin bundles" href="/de/plugins/bundles">
    Kompatibilitätsmodell für Bundles.
  </Card>
  <Card title="Plugin manifest" href="/de/plugins/manifest">
    Manifest-Felder und Konfigurationsschema.
  </Card>
  <Card title="Security" href="/de/gateway/security">
    Sicherheits-Härtung für Plugin-Installationen.
  </Card>
</CardGroup>

## Befehle

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Für Untersuchungen zu langsamen Installationen, Inspektionen, Deinstallationen oder Registry-Aktualisierungen führen Sie den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasenzeiten
nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Plugin-Lifecycle-Mutatoren deaktiviert. Verwenden Sie stattdessen die Nix-Quelle für diese Installation anstelle von `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; für nix-openclaw verwenden Sie den agentenzentrierten [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche Listen-/Info-Ausgaben zeigen außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Installieren

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainer, die Installationen zur Einrichtungszeit testen, können automatische Plugin-Installationsquellen
mit geschützten Umgebungsvariablen überschreiben. Siehe
[Überschreibungen für Plugin-Installationen](/de/plugins/install-overrides).

<Warning>
Bloße Paketnamen installieren während der Launch-Umstellung standardmäßig von npm. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie angeheftete Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
installationsbereite Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete,
nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Discovery-Oberfläche für die meisten Plugins. Npm
bleibt ein unterstützter Fallback- und Direktinstallationspfad. OpenClaw-eigene
`@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie
auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im
[Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Installationen und Updates im Beta-Kanal bevorzugen den npm-`beta`-Dist-Tag, wenn dieser Tag
verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Wenn Ihr Abschnitt `plugins` durch ein einzelnes `$include` in einer Datei gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit gleichrangigen Überschreibungen schlagen geschlossen fehl, anstatt sie zu glätten. Siehe [Config-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und fordert Sie auf, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts und Hot Reloads schlägt ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration geschlossen fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag in Quarantäne verschieben. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein schmaler Wiederherstellungspfad für gebündelte Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie es, wenn Sie absichtlich dieselbe ID von einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation tatsächlich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` gilt nur für npm-Installationen. Es wird mit `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Ref wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine angeheftete Quelle möchten. Es wird mit `--marketplace` nicht unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation dauerhaft speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist eine Notfalloption für Fehlalarme im integrierten Scanner für gefährlichen Code. Sie erlaubt der Installation fortzufahren, selbst wenn der integrierte Scanner `critical`-Funde meldet, umgeht aber **nicht** Richtlinienblockaden von Plugin-`before_install`-Hooks und umgeht **nicht** Scanfehler.

    Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen verwenden die passende `dangerouslyForceUnsafeInstall`-Request-Überschreibung, während `openclaw skills install` ein separater ClawHub-Ablauf zum Herunterladen/Installieren von Skills bleibt.

    Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Registry-Scan blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub](/de/clawhub/security).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname + optionale **exakte Version** oder **Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen zur Sicherheit projektlokal mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Roots erben die paketweiten npm-`overrides` von OpenClaw, sodass Host-Sicherheitspins auch für hochgezogene Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Bloße Paketspezifikationen installieren während der Launch-Umstellung ebenfalls direkt von npm.

    Bloße Spezifikationen und `@latest` bleiben auf dem stabilen Track. Datumsstempelte OpenClaw-Korrekturversionen wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine davon zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` dafür zu entscheiden.

    Wenn eine bloße Installationsspezifikation einer offiziellen Plugin-ID entspricht (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite bereichsbezogene Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen sind unter anderem `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, Tag oder Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Ref aus, wenn vorhanden, und verwenden dann den normalen Installer für Plugin-Verzeichnisse. Das bedeutet, dass Manifest-Validierung, Scans auf gefährlichen Code, Paketmanager-Installationsarbeit und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/-Ref plus den aufgelösten Commit, sodass `openclaw plugins update` die Quelle später erneut auflösen kann.

    Nach der Installation aus Git verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu prüfen. Wenn das Plugin mit `api.registerCli` einen CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` am extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie
    denselben verwalteten npm-Root-Installationspfad testen möchten, der von Registry-Installationen verwendet wird,
    einschließlich `package-lock.json`-Prüfung, Scans hochgezogener Abhängigkeiten und
    npm-Installationsdatensätzen. Einfache Archivpfade installieren weiterhin als lokale Archive
    unter dem Root für Plugin-Erweiterungen.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung standardmäßig von npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um die reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft die angekündigte Plugin-API / Mindestkompatibilität des Gateways vor der Installation. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Verifizierungspfad für Paketarchive installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Updates.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gebunden.

#### Marketplace-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit übergeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - ein Claude-Name für einen bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marketplace-Root oder ein `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzform wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Bei Remote-Marketplaces, die aus GitHub oder git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repo bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, absolute Pfad-, git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

<Note>
Kompatible Bundles werden im normalen Plugin-Root installiert und nehmen am gleichen List-/Info-/Aktivieren-/Deaktivieren-Ablauf teil. Derzeit werden Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Vorgaben, Claude-`.lsp.json`- / im Manifest deklarierte `lspServers`-Vorgaben, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnose/Info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
</Note>

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Nur aktivierte Plugins anzeigen.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Quell-/Ursprungs-/Versions-/Aktivierungsmetadaten wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar plus Registry-Diagnose und Installationsstatus der Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, aber es ist keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Starten Sie nach Änderungen an Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Prüfen Sie bei Remote-/Container-Deployments, dass Sie den tatsächlichen untergeordneten `openclaw gateway run`-Prozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin dessen `dependencyStatus` aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es importiert keinen Plugin-Laufzeitcode, führt keinen Paketmanager aus und repariert keine fehlenden Abhängigkeiten.
</Note>

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Es untersucht keinen lokalen
Status, verändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Laufzeitcode. Suchergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version, die Zusammenfassung und einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für die Arbeit an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-Quellverzeichnis über den passenden paketierten Quellpfad ein, etwa
`/app/extensions/synology-chat`. OpenClaw entdeckt dieses gemountete Quell-Overlay vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quellverzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte Dist verwenden.

Für das Debugging von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Die Laufzeitinspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um Legacy-Abhängigkeitsstatus zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, auf die in der Konfiguration verwiesen wird.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Dienst-/Prozesshinweise, den Konfigurationspfad und den RPC-Zustand.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den Quellpfad wiederverwenden, statt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungebunden bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Status, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in `plugins/installs.json` unter dem aktiven OpenClaw-State-Verzeichnis. Die oberste `installRecords`-Map ist die dauerhafte Quelle für Installationsmetadaten, einschließlich Datensätzen für beschädigte oder fehlende Plugin-Manifeste. Das `plugins`-Array ist der aus Manifesten abgeleitete Kalt-Registry-Cache. Die Datei enthält eine Nicht-bearbeiten-Warnung und wird von `openclaw plugins update`, Deinstallation, Diagnose und der kalten Plugin-Registry verwendet.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Datensätze in der Konfiguration sieht, behandeln Laufzeit-Lesevorgänge sie als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Datensätze in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge erlaubt sind; wenn einer der Schreibvorgänge fehlschlägt, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Allow-/Deny-List-Einträgen und verlinkten `plugins.load.paths`-Einträgen, falls zutreffend. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb von OpenClaws Plugin-Erweiterungsroot befindet. Bei Active-Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und für nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin erneut. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und exakt gebundene Versionen bei späteren `update <id>`-Läufen weiterverwendet werden.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem dist-tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den nachverfolgten Plugin-Datensatz auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Updates auf.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls zurück auf den nachverfolgten Plugin-Datensatz aufgelöst. Verwenden Sie dies, wenn ein Plugin an eine exakte Version gebunden war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` verwendet die nachverfolgte Plugin-Spezifikation erneut, sofern Sie keine neue Spezifikation übergeben. `openclaw update` kennt zusätzlich den aktiven OpenClaw-Update-Kanal: Im Beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze auf der Standardlinie zuerst `@beta` und fallen dann auf die aufgezeichnete default/latest-Spezifikation zurück, wenn kein Plugin-Beta-Release vorhanden ist. Exakte Versionen und explizite Tags bleiben an diesen Selektor gebunden.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits dem aufgelösten Ziel entsprechen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefakt-Drift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Update-Helfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` ist auch bei `plugins update` als Break-Glass-Override für falsch positive Treffer des integrierten Dangerous-Code-Scans während Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblöcke oder Blockierungen durch Scan-Fehler und gilt nur für Plugin-Updates, nicht für Hook-Pack-Updates.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifestfähigkeiten, Richtlinienflags, Diagnose, Installationsmetadaten, Bundle-Fähigkeiten sowie jede erkannte MCP- oder LSP-Server-Unterstützung, ohne standardmäßig Plugin-Laufzeit zu importieren. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzuschließen. Die Laufzeitinspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als Root-`openclaw`-Befehlsgruppen installiert, aber Plugins können auch verschachtelte Befehle unter einem Core-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` angezeigt hat, führen Sie ihn am aufgeführten Pfad aus; beispielsweise kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Capability-Typ (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Capability-Typen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Capabilities oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Capabilities

Weitere Informationen zum Capability-Modell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Capability-Arten, Kompatibilitätshinweise, Bundle-Capabilities und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorhergehende Diagnose zum blockierten Plugin, etwa Pfadbesitz oder weltbeschreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Führen Sie bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exports den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Export-Form in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Ownership von Contributions. Normaler Start, Provider-Owner-Lookup, Klassifizierung der Channel-Einrichtung und Plugin-Inventar können sie lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und den Manifest-/Paketmetadaten neu zu erstellen. Dies ist ein Reparaturpfad, kein Pfad zur Laufzeitaktivierung.

`openclaw doctor --fix` repariert außerdem Registry-nahe Abweichungen bei verwaltetem npm: Wenn ein verwaistes oder wiederhergestelltes Paket `@openclaw/*` unter dem verwalteten Plugin-npm-Root ein gebündeltes Plugin überschattet, entfernt Doctor dieses veraltete Paket und erstellt die Registry neu, damit der Start gegen das gebündelte Manifest validiert.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Verwenden Sie bevorzugt `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung beim Start vorgesehen, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt das aufgelöste Quelllabel sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/de/clawhub)
