---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corrigir problemas de inicialização do CDP do Chrome/Brave/Edge/Chromium para o controle de navegador do OpenClaw no Linux
title: Solução de problemas do navegador
x-i18n:
    generated_at: "2026-04-30T10:09:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problema: "Falha ao iniciar o CDP do Chrome na porta 18800"

O servidor de controle de navegador do OpenClaw falha ao iniciar Chrome/Brave/Edge/Chromium com o erro:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Causa raiz

No Ubuntu (e em muitas distribuições Linux), a instalação padrão do Chromium é um **pacote snap**. O confinamento AppArmor do Snap interfere na forma como o OpenClaw inicia e monitora o processo do navegador.

O comando `apt install chromium` instala um pacote auxiliar que redireciona para snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Isso NÃO é um navegador real - é apenas um wrapper.

Outras falhas comuns de inicialização no Linux:

- `The profile appears to be in use by another Chromium process` significa que o Chrome
  encontrou arquivos de bloqueio `Singleton*` obsoletos no diretório de perfil gerenciado. O OpenClaw
  remove esses bloqueios e tenta novamente uma vez quando o bloqueio aponta para um processo morto ou
  de outro host.
- `Missing X server or $DISPLAY` significa que um navegador visível foi explicitamente
  solicitado em um host sem uma sessão de desktop. Por padrão, perfis gerenciados locais
  agora voltam para o modo headless no Linux quando `DISPLAY` e
  `WAYLAND_DISPLAY` estão ambos indefinidos. Se você definir `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` ou `browser.profiles.<name>.headless: false`,
  remova essa substituição com interface, defina `OPENCLAW_BROWSER_HEADLESS=1`, inicie `Xvfb`,
  execute `openclaw browser start --headless` para uma inicialização gerenciada avulsa, ou execute
  o OpenClaw em uma sessão de desktop real.

### Solução 1: Instalar o Google Chrome (recomendado)

Instale o pacote `.deb` oficial do Google Chrome, que não é isolado pelo snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Em seguida, atualize sua configuração do OpenClaw (`~/.openclaw/openclaw.json`):

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

### Solução 2: Usar o Chromium do Snap com modo somente anexar

Se você precisa usar o Chromium do snap, configure o OpenClaw para anexar a um navegador iniciado manualmente:

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

Habilite com: `systemctl --user enable --now openclaw-browser.service`

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

| Opção                            | Descrição                                                            | Padrão                                                      |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Habilitar controle do navegador                                      | `true`                                                      |
| `browser.executablePath`         | Caminho para um binário de navegador baseado em Chromium (Chrome/Brave/Edge/Chromium) | detectado automaticamente (prefere o navegador padrão quando baseado em Chromium) |
| `browser.headless`               | Executar sem GUI                                                     | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Substituição por processo para o modo headless do navegador gerenciado local | indefinido                                                  |
| `browser.noSandbox`              | Adicionar a flag `--no-sandbox` (necessária para algumas configurações Linux) | `false`                                                     |
| `browser.attachOnly`             | Não iniciar o navegador, apenas anexar ao existente                  | `false`                                                     |
| `browser.cdpPort`                | Porta do Chrome DevTools Protocol                                    | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Tempo limite de descoberta do Chrome gerenciado local                | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Tempo limite de prontidão do CDP após inicialização gerenciada local | `8000`                                                      |

No Raspberry Pi, em hosts VPS mais antigos ou em armazenamento lento, aumente
`browser.localLaunchTimeoutMs` quando o Chrome precisar de mais tempo para expor seu endpoint
HTTP de CDP. Aumente `browser.localCdpReadyTimeoutMs` quando a inicialização for bem-sucedida, mas
`openclaw browser start` ainda relatar `not reachable after start`. Os valores devem
ser inteiros positivos até `120000` ms; valores de configuração inválidos são rejeitados.

### Problema: "Nenhuma aba do Chrome encontrada para profile=\"user\""

Você está usando um perfil `existing-session` / Chrome MCP. O OpenClaw consegue ver o Chrome local,
mas não há abas abertas disponíveis para anexar.

Opções de correção:

1. **Use o navegador gerenciado:** `openclaw browser start --browser-profile openclaw`
   (ou defina `browser.defaultProfile: "openclaw"`).
2. **Use o Chrome MCP:** garanta que o Chrome local esteja em execução com pelo menos uma aba aberta e tente novamente com `--browser-profile user`.

Observações:

- `user` é apenas para o host. Para servidores Linux, contêineres ou hosts remotos, prefira perfis CDP.
- `user` / outros perfis `existing-session` mantêm os limites atuais do Chrome MCP:
  ações orientadas por referência, hooks de upload de um arquivo, sem substituições de tempo limite de diálogo, sem
  `wait --load networkidle` e sem `responsebody`, exportação de PDF, interceptação de download
  ou ações em lote.
- Perfis `openclaw` locais atribuem automaticamente `cdpPort`/`cdpUrl`; defina esses valores apenas para CDP remoto.
- Perfis CDP remotos aceitam `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) para descoberta de `/json/version`, ou WS(S) quando seu serviço de navegador
  fornecer uma URL direta de socket DevTools.

## Relacionado

- [Navegador](/pt-BR/tools/browser)
- [Login no navegador](/pt-BR/tools/browser-login)
- [Solução de problemas do navegador WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
