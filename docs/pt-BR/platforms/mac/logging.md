---
read_when:
    - Captura de logs do macOS ou investigação do registro de dados privados
    - Depuração de problemas no ciclo de vida da ativação por voz e da sessão
summary: 'Registro em log do OpenClaw: arquivo rotativo de logs de diagnóstico + sinalizadores de privacidade do log unificado'
title: Registro em log no macOS
x-i18n:
    generated_at: "2026-07-12T00:07:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Registro de logs (macOS)

## Log de arquivo de diagnóstico rotativo (painel de Depuração)

O aplicativo para macOS registra logs por meio do swift-log (usando o sistema unificado de logs por padrão) e também pode gravar um log rotativo em um arquivo local para captura persistente (`DiagnosticsFileLog`).

- Ativar: **painel de Depuração -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (desativado por padrão).
- Nível de detalhamento: seletor **painel de Depuração -> Logs -> App logging -> Verbosity**.
- Local: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotação: ocorre ao atingir 5 MB; mantém até 5 backups com os sufixos `.1`...`.5` (o mais antigo é descartado).
- Limpar: **painel de Depuração -> Logs -> App logging -> "Clear"** exclui o arquivo ativo e todos os backups.

Trate o arquivo como confidencial; não o compartilhe sem revisá-lo.

## Dados privados no sistema unificado de logs do macOS

O sistema unificado de logs oculta a maioria das cargas úteis, a menos que um subsistema habilite `privacy -off`. Isso é controlado por um plist em `/Library/Preferences/Logging/Subsystems/`, identificado pelo nome do subsistema. Somente novas entradas de log aplicam essa opção; portanto, ative-a antes de reproduzir um problema. Contexto: [peculiaridades de privacidade do sistema de logs do macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Ativar para o OpenClaw (`ai.openclaw`)

Primeiro, grave o plist em um arquivo temporário e depois instale-o atomicamente como root:

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

Não é necessário reiniciar; o logd detecta o arquivo rapidamente, mas somente novas linhas de log incluem cargas úteis privadas. Veja a saída mais detalhada com `./scripts/clawlog.sh --category WebChat --last 5m` (`--last`/`-l` define o intervalo de tempo, com o padrão `5m`; `--category`/`-c` filtra por categoria).

## Desativar após a depuração

- Remova a substituição: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Opcionalmente, execute `sudo log config --reload` para forçar o logd a descartar a substituição imediatamente.
- Essa saída pode incluir números de telefone e o conteúdo das mensagens; mantenha o plist instalado somente enquanto ele for realmente necessário.

## Relacionado

- [aplicativo para macOS](/pt-BR/platforms/macos)
- [registro de logs do Gateway](/pt-BR/gateway/logging)
