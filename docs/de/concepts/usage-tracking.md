---
read_when:
    - Sie binden Oberflächen für Provider-Nutzung und -Kontingente an
    - Sie müssen das Verhalten der Nutzungserfassung oder Authentifizierungsanforderungen erklären
summary: Oberflächen zur Nutzungsverfolgung und Anforderungen an Zugangsdaten
title: Nutzungserfassung
x-i18n:
    generated_at: "2026-05-02T06:32:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Was es ist

- Ruft Provider-Nutzung/-Kontingente direkt von deren Nutzungsendpunkten ab.
- Keine geschätzten Kosten; nur die vom Provider gemeldeten Zeitfenster.
- Die menschenlesbare Statusausgabe wird auf `X% left` normalisiert, selbst wenn eine
  vorgelagerte API verbrauchtes Kontingent, verbleibendes Kontingent oder nur Rohzählwerte meldet.
- Sitzungsweites `/status` und `session_status` können auf den neuesten
  Transkript-Nutzungseintrag zurückfallen, wenn der Live-Sitzungssnapshot spärlich ist. Dieser
  Fallback ergänzt fehlende Token-/Cache-Zähler, kann das aktive Laufzeit-Modelllabel
  wiederherstellen und bevorzugt die größere promptorientierte Gesamtsumme, wenn Sitzungsmetadaten
  fehlen oder kleiner sind. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang.

## Wo es angezeigt wird

- `/status` in Chats: emoji-reiche Statuskarte mit Sitzungs-Tokens + geschätzten Kosten (nur API-Schlüssel). Provider-Nutzung wird für den **aktuellen Modell-Provider** angezeigt, sofern verfügbar, als normalisiertes `X% left`-Zeitfenster.
- `/usage off|tokens|full` in Chats: Nutzungsfußzeile pro Antwort (OAuth zeigt nur Tokens).
- `/usage cost` in Chats: lokale Kostenzusammenfassung, aggregiert aus OpenClaw-Sitzungsprotokollen.
- CLI: `openclaw status --usage` gibt eine vollständige Aufschlüsselung pro Provider aus.
- CLI: `openclaw channels list` gibt denselben Nutzungssnapshot neben der Provider-Konfiguration aus (verwenden Sie `--no-usage`, um dies zu überspringen).
- macOS-Menüleiste: Abschnitt „Nutzung“ unter Kontext (nur wenn verfügbar).

## Provider + Anmeldedaten

- **Anthropic (Claude)**: OAuth-Tokens in Auth-Profilen.
- **GitHub Copilot**: OAuth-Tokens in Auth-Profilen.
- **Gemini CLI**: OAuth-Tokens in Auth-Profilen.
  - JSON-Nutzung fällt auf `stats` zurück; `stats.cached` wird in
    `cacheRead` normalisiert.
- **OpenAI Codex**: OAuth-Tokens in Auth-Profilen (`accountId` wird verwendet, wenn vorhanden).
- **MiniMax**: API-Schlüssel oder MiniMax-OAuth-Auth-Profil. OpenClaw behandelt
  `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingentoberfläche,
  bevorzugt gespeichertes MiniMax-OAuth, wenn vorhanden, und fällt andernfalls auf
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY` zurück.
  Die Nutzungsabfrage leitet den Coding-Plan-Host aus `models.providers.minimax-portal.baseUrl`
  oder `models.providers.minimax.baseUrl` ab, wenn konfiguriert, und verwendet andernfalls den
  MiniMax-CN-Host.
  Die Rohfelder `usage_percent` / `usagePercent` von MiniMax bedeuten **verbleibendes**
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige; zählwertbasierte Felder haben Vorrang,
  wenn vorhanden.
  - Coding-Plan-Zeitfensterlabels stammen aus den Stunden-/Minutenfeldern des Providers, wenn
    vorhanden, und fallen dann auf die Spanne `start_time` / `end_time` zurück.
  - Wenn der Coding-Plan-Endpunkt `model_remains` zurückgibt, bevorzugt OpenClaw den
    Chat-Modell-Eintrag, leitet das Zeitfensterlabel aus Zeitstempeln ab, wenn explizite
    Felder `window_hours` / `window_minutes` fehlen, und nimmt den Modellnamen in das Planlabel auf.
- **Xiaomi MiMo**: API-Schlüssel über Env/Konfiguration/Auth-Speicher (`XIAOMI_API_KEY`).
- **z.ai**: API-Schlüssel über Env/Konfiguration/Auth-Speicher.

Nutzung wird ausgeblendet, wenn keine verwendbare Provider-Nutzungs-Authentifizierung ermittelt werden kann. Provider
können Plugin-spezifische Authentifizierungslogik für Nutzung bereitstellen; andernfalls fällt OpenClaw auf
passende OAuth-/API-Schlüssel-Anmeldedaten aus Auth-Profilen, Umgebungsvariablen
oder Konfiguration zurück.

## Verwandt

- [Token-Nutzung und Kosten](/de/reference/token-use)
- [API-Nutzung und Kosten](/de/reference/api-usage-costs)
- [Prompt-Caching](/de/reference/prompt-caching)
