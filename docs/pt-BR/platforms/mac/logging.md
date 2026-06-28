---
read_when:
    - Captura de registros do macOS ou investigação do registro de dados privados
    - Depuração de problemas de ativação por voz e ciclo de vida da sessão
summary: 'Registro em log do OpenClaw: log de arquivo de diagnóstico rotativo + sinalizadores de privacidade do log unificado'
title: Logs do macOS
x-i18n:
    generated_at: "2026-05-06T06:03:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Logs (macOS)

## Log rotativo de diagnósticos em arquivo (painel de Depuração)

O OpenClaw encaminha os logs do app para macOS por meio do swift-log (logging unificado por padrão) e pode gravar em disco um log local rotativo em arquivo quando você precisar de uma captura durável.

- Verbosidade: **painel de Depuração → Logs → Logs do app → Verbosidade**
- Ativar: **painel de Depuração → Logs → Logs do app → "Gravar log rotativo de diagnósticos (JSONL)"**
- Localização: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotaciona automaticamente; arquivos antigos recebem sufixos `.1`, `.2`, …)
- Limpar: **painel de Depuração → Logs → Logs do app → "Limpar"**

Observações:

- Isso fica **desativado por padrão**. Ative somente durante a depuração ativa.
- Trate o arquivo como sensível; não o compartilhe sem revisão.

## Dados privados do logging unificado no macOS

O logging unificado redige a maioria dos payloads, a menos que um subsistema opte por `privacy -off`. Conforme o texto do Peter sobre [artimanhas de privacidade em logging](https://steipete.me/posts/2025/logging-privacy-shenanigans) no macOS (2025), isso é controlado por um plist em `/Library/Preferences/Logging/Subsystems/` com chave pelo nome do subsistema. Somente novas entradas de log usam a flag, então ative-a antes de reproduzir um problema.

## Ativar para o OpenClaw (`ai.openclaw`)

- Grave o plist em um arquivo temporário primeiro e depois instale-o atomicamente como root:

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

- Nenhuma reinicialização é necessária; o logd percebe o arquivo rapidamente, mas somente novas linhas de log incluirão payloads privados.
- Veja a saída mais rica com o helper existente, por exemplo `./scripts/clawlog.sh --category WebChat --last 5m`.

## Desativar após a depuração

- Remova a substituição: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente, execute `sudo log config --reload` para forçar o logd a descartar a substituição imediatamente.
- Lembre-se de que essa superfície pode incluir números de telefone e corpos de mensagens; mantenha o plist em vigor somente enquanto você precisar ativamente dos detalhes extras.

## Relacionados

- [app para macOS](/pt-BR/platforms/macos)
- [Logs do Gateway](/pt-BR/gateway/logging)
