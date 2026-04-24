---
read_when:
    - Capturando logs do macOS ou investigando registro de dados privados
    - Depurando problemas de ciclo de vida de sessão/voice wake
summary: 'Logging do OpenClaw: log de arquivo de diagnóstico com rotação + flags de privacidade do log unificado'
title: Logging no macOS
x-i18n:
    generated_at: "2026-04-24T06:01:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging (macOS)

## Log de arquivo de diagnóstico com rotação (painel Debug)

O OpenClaw roteia logs do app macOS por meio de swift-log (logging unificado por padrão) e pode gravar um log local rotativo em arquivo no disco quando você precisar de uma captura durável.

- Verbosidade: **Painel Debug → Logs → App logging → Verbosity**
- Habilitar: **Painel Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Local: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotaciona automaticamente; arquivos antigos recebem os sufixos `.1`, `.2`, …)
- Limpar: **Painel Debug → Logs → App logging → “Clear”**

Observações:

- Isso fica **desativado por padrão**. Habilite apenas enquanto estiver depurando ativamente.
- Trate o arquivo como sensível; não o compartilhe sem revisão.

## Dados privados no logging unificado do macOS

O logging unificado redige a maior parte dos payloads, a menos que um subsistema opte por `privacy -off`. Segundo o texto do Peter sobre [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) no macOS (2025), isso é controlado por um plist em `/Library/Preferences/Logging/Subsystems/`, indexado pelo nome do subsistema. Apenas novas entradas de log usam a flag, então habilite-a antes de reproduzir um problema.

## Habilitar para o OpenClaw (`ai.openclaw`)

- Grave primeiro o plist em um arquivo temporário e depois instale-o atomicamente como root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Não é necessário reiniciar; o logd percebe o arquivo rapidamente, mas apenas novas linhas de log incluirão payloads privados.
- Veja a saída mais rica com o helper existente, por exemplo `./scripts/clawlog.sh --category WebChat --last 5m`.

## Desabilitar após depuração

- Remova a substituição: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente execute `sudo log config --reload` para forçar o logd a remover a substituição imediatamente.
- Lembre-se de que essa superfície pode incluir números de telefone e corpos de mensagens; mantenha o plist em vigor apenas enquanto você realmente precisar do detalhe extra.

## Relacionado

- [App do macOS](/pt-BR/platforms/macos)
- [Logging do Gateway](/pt-BR/gateway/logging)
