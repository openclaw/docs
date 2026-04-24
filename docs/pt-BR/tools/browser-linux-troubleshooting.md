---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corrigir problemas de inicialização de CDP do Chrome/Brave/Edge/Chromium para o controle de navegador do OpenClaw no Linux
title: Solução de problemas do navegador
x-i18n:
    generated_at: "2026-04-24T06:14:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problema: "Failed to start Chrome CDP on port 18800"

O servidor de controle de navegador do OpenClaw falha ao iniciar Chrome/Brave/Edge/Chromium com o erro:

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

Isso NÃO é um navegador real — é apenas um wrapper.

### Solução 1: Instalar Google Chrome (Recomendado)

Instale o pacote `.deb` oficial do Google Chrome, que não é sandboxed por snap:

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

### Solução 2: Usar Chromium Snap com modo somente attach

Se você precisar usar o Chromium via snap, configure o OpenClaw para se conectar a um navegador iniciado manualmente:

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

3. Opcionalmente, crie um serviço systemd de usuário para iniciar o Chrome automaticamente:

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

### Verificar se o navegador funciona

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

| Opção                    | Descrição                                                            | Padrão                                                      |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Ativa o controle do navegador                                        | `true`                                                      |
| `browser.executablePath` | Caminho para um binário de navegador baseado em Chromium (Chrome/Brave/Edge/Chromium) | detectado automaticamente (prefere o navegador padrão quando é baseado em Chromium) |
| `browser.headless`       | Executa sem interface gráfica                                        | `false`                                                     |
| `browser.noSandbox`      | Adiciona a flag `--no-sandbox` (necessária em algumas configurações Linux) | `false`                                                     |
| `browser.attachOnly`     | Não inicia o navegador, apenas se conecta a um existente             | `false`                                                     |
| `browser.cdpPort`        | Porta do Chrome DevTools Protocol                                    | `18800`                                                     |

### Problema: "No Chrome tabs found for profile=\"user\""

Você está usando um perfil `existing-session` / Chrome MCP. O OpenClaw consegue ver o Chrome local,
mas não há abas abertas disponíveis para conexão.

Opções de correção:

1. **Use o navegador gerenciado:** `openclaw browser start --browser-profile openclaw`
   (ou defina `browser.defaultProfile: "openclaw"`).
2. **Use Chrome MCP:** certifique-se de que o Chrome local está em execução com pelo menos uma aba aberta e depois tente novamente com `--browser-profile user`.

Observações:

- `user` é apenas para host. Para servidores Linux, contêineres ou hosts remotos, prefira perfis CDP.
- Perfis `user` / outros `existing-session` mantêm os limites atuais do Chrome MCP:
  ações orientadas por ref, hooks de upload de um único arquivo, sem substituições de timeout de diálogo, sem
  `wait --load networkidle` e sem `responsebody`, exportação PDF, interceptação de download ou ações em lote.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina isso apenas para CDP remoto.
- Perfis CDP remotos aceitam `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) para descoberta via `/json/version`, ou WS(S) quando seu serviço
  de navegador fornecer uma URL direta de socket DevTools.

## Relacionado

- [Navegador](/pt-BR/tools/browser)
- [Login no navegador](/pt-BR/tools/browser-login)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
