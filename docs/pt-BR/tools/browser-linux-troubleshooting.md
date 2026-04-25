---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corrigir problemas de inicialização de CDP no Chrome/Brave/Edge/Chromium para o controle do navegador do OpenClaw no Linux
title: Solução de problemas do Browser
x-i18n:
    generated_at: "2026-04-25T13:56:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problema: "Failed to start Chrome CDP on port 18800"

O servidor de controle do navegador do OpenClaw falha ao iniciar Chrome/Brave/Edge/Chromium com o erro:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Causa raiz

No Ubuntu (e em muitas distribuições Linux), a instalação padrão do Chromium é um **pacote snap**. O confinamento AppArmor do snap interfere na forma como o OpenClaw inicia e monitora o processo do navegador.

O comando `apt install chromium` instala um pacote stub que redireciona para snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Isto NÃO é um navegador real — é apenas um wrapper.

Outras falhas comuns de inicialização no Linux:

- `The profile appears to be in use by another Chromium process` significa que o Chrome
  encontrou arquivos de lock `Singleton*` obsoletos no diretório do perfil gerenciado. O OpenClaw
  remove esses locks e tenta novamente uma vez quando o lock aponta para um processo morto ou de outro host.
- `Missing X server or $DISPLAY` significa que um navegador visível foi explicitamente
  solicitado em um host sem sessão de desktop. Por padrão, perfis gerenciados locais agora recorrem ao modo headless no Linux quando `DISPLAY` e
  `WAYLAND_DISPLAY` estão ambos ausentes. Se você definir `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` ou `browser.profiles.<name>.headless: false`,
  remova essa substituição headed, defina `OPENCLAW_BROWSER_HEADLESS=1`, inicie `Xvfb`,
  execute `openclaw browser start --headless` para uma inicialização gerenciada pontual ou execute
  o OpenClaw em uma sessão real de desktop.

### Solução 1: Instalar o Google Chrome (Recomendado)

Instale o pacote `.deb` oficial do Google Chrome, que não é isolado por snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # se houver erros de dependência
```

Depois atualize sua configuração do OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solução 2: Usar o Chromium Snap com modo somente anexação

Se você precisar usar o Chromium snap, configure o OpenClaw para anexar-se a um navegador iniciado manualmente:

1. Atualize a configuração:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Inicie o Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Opcionalmente, crie um serviço de usuário systemd para iniciar o Chrome automaticamente:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Ative com: `systemctl --user enable --now openclaw-browser.service`

### Verificando se o navegador funciona

Verifique o status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Teste a navegação:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referência de configuração

| Opção                            | Descrição                                                            | Padrão                                                      |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Ativa o controle do navegador                                        | `true`                                                      |
| `browser.executablePath`         | Caminho para um binário de navegador baseado em Chromium (Chrome/Brave/Edge/Chromium) | detectado automaticamente (prefere o navegador padrão quando baseado em Chromium) |
| `browser.headless`               | Executa sem GUI                                                      | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Substituição por processo para o modo headless do navegador gerenciado local | não definido                                                |
| `browser.noSandbox`              | Adiciona a flag `--no-sandbox` (necessária em algumas configurações Linux) | `false`                                                     |
| `browser.attachOnly`             | Não inicia o navegador, apenas anexa a um existente                  | `false`                                                     |
| `browser.cdpPort`                | Porta do Chrome DevTools Protocol                                    | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Timeout de descoberta do Chrome gerenciado local                     | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Timeout local de prontidão do CDP após inicialização                 | `8000`                                                      |

Em Raspberry Pi, VPSs antigos ou armazenamento lento, aumente
`browser.localLaunchTimeoutMs` quando o Chrome precisar de mais tempo para expor seu endpoint HTTP CDP.
Aumente `browser.localCdpReadyTimeoutMs` quando a inicialização tiver êxito, mas
`openclaw browser start` ainda informar `not reachable after start`. Os valores são
limitados a 120000 ms.

### Problema: "No Chrome tabs found for profile=\"user\""

Você está usando um perfil `existing-session` / Chrome MCP. O OpenClaw consegue ver o Chrome local,
mas não há abas abertas disponíveis para anexar.

Opções de correção:

1. **Use o navegador gerenciado:** `openclaw browser start --browser-profile openclaw`
   (ou defina `browser.defaultProfile: "openclaw"`).
2. **Use Chrome MCP:** certifique-se de que o Chrome local está rodando com pelo menos uma aba aberta e então tente novamente com `--browser-profile user`.

Observações:

- `user` é apenas para host. Para servidores Linux, contêineres ou hosts remotos, prefira perfis CDP.
- Perfis `user` / outros perfis `existing-session` mantêm os limites atuais do Chrome MCP:
  ações orientadas por ref, hooks de upload de um único arquivo, sem substituições de timeout de diálogo, sem
  `wait --load networkidle` e sem `responsebody`, exportação de PDF, interceptação de download ou ações em lote.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina esses campos apenas para CDP remoto.
- Perfis CDP remotos aceitam `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) para descoberta por `/json/version` ou WS(S) quando seu serviço de navegador
  fornecer uma URL direta de socket DevTools.

## Relacionado

- [Browser](/pt-BR/tools/browser)
- [Browser login](/pt-BR/tools/browser-login)
- [Browser WSL2 troubleshooting](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
