---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corrija problemas de inicialização do CDP no Chrome/Brave/Edge/Chromium para o controle de navegador do OpenClaw no Linux
title: Solução de problemas do navegador
x-i18n:
    generated_at: "2026-07-12T15:42:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problema: falha ao iniciar o Chrome CDP na porta 18800

```json
{ "error": "Erro: falha ao iniciar o Chrome CDP na porta 18800 para o perfil \"openclaw\"." }
```

### Causa raiz

No Ubuntu e na maioria das distribuições Linux, `apt install chromium` instala um
wrapper snap, não um navegador real:

```text
Observação: selecionando 'chromium-browser' em vez de 'chromium'
chromium-browser já está na versão mais recente (2:1snap1-0ubuntu2).
```

O confinamento do AppArmor do snap interfere na forma como o OpenClaw inicia e monitora
o processo do navegador.

Outras falhas comuns de inicialização no Linux:

- `The profile appears to be in use by another Chromium process`: arquivos de bloqueio
  `Singleton*` obsoletos no diretório do perfil gerenciado. O OpenClaw remove
  esses bloqueios e tenta novamente uma vez quando o bloqueio aponta para um processo
  encerrado ou em outro host.
- `Missing X server or $DISPLAY`: foi solicitado explicitamente um navegador visível
  em um host sem uma sessão de desktop. Perfis locais gerenciados usam
  o modo headless como fallback no Linux quando `DISPLAY` e `WAYLAND_DISPLAY` não estão definidos.
  Se você definiu `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` ou
  `browser.profiles.<name>.headless: false`, remova essa substituição para o modo com interface,
  defina `OPENCLAW_BROWSER_HEADLESS=1`, inicie o `Xvfb`, execute
  `openclaw browser start --headless` para uma inicialização gerenciada única ou execute
  o OpenClaw em uma sessão de desktop real.

### Solução 1: instalar o Google Chrome (recomendado)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # se houver erros de dependência
```

Atualize `~/.openclaw/openclaw.json`:

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

### Solução 2: usar o Chromium via snap no modo somente anexação

Se você precisar manter o Chromium via snap, configure o OpenClaw para se conectar a um
navegador iniciado manualmente, em vez de iniciá-lo:

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

Inicie o Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Opcionalmente, inicie-o automaticamente com um serviço de usuário do systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=Navegador do OpenClaw (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### Verificar se o navegador funciona

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referência de configuração

| Opção                            | Descrição                                                                            | Padrão                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `browser.enabled`                | Habilita o controle do navegador                                                     | `true`                                                                                  |
| `browser.executablePath`         | Caminho para um binário de navegador baseado no Chromium (Chrome/Brave/Edge/Chromium) | detectado automaticamente (prioriza o navegador padrão do SO quando baseado no Chromium) |
| `browser.headless`               | Executa sem interface gráfica                                                        | `false`                                                                                 |
| `OPENCLAW_BROWSER_HEADLESS`      | Substituição por processo para o modo headless do navegador local gerenciado          | não definido                                                                            |
| `browser.noSandbox`              | Adiciona a opção `--no-sandbox` (necessária em algumas configurações do Linux)        | `false`                                                                                 |
| `browser.attachOnly`             | Não inicia um navegador; apenas se conecta a um existente                            | `false`                                                                                 |
| `browser.cdpPortRangeStart`      | Porta CDP local inicial para perfis atribuídos automaticamente                       | `18800` (derivada da porta do Gateway)                                                   |
| `browser.localLaunchTimeoutMs`   | Tempo limite para detectar o Chrome local gerenciado, até `120000`                   | `15000`                                                                                 |
| `browser.localCdpReadyTimeoutMs` | Tempo limite de prontidão do CDP local gerenciado após a inicialização, até `120000`  | `8000`                                                                                  |

Ambos os valores de tempo limite devem ser números inteiros positivos de até `120000` ms; outros valores
são rejeitados durante o carregamento da configuração. No Raspberry Pi, em hosts VPS mais antigos ou com
armazenamento lento, aumente `browser.localLaunchTimeoutMs` quando o Chrome precisar de mais tempo para
expor seu endpoint HTTP do CDP. Aumente `browser.localCdpReadyTimeoutMs` quando
a inicialização for bem-sucedida, mas `openclaw browser start` ainda informar `not reachable
after start`.

### Problema: nenhuma aba do Chrome encontrada para profile="user"

Você está usando o perfil `user` (`existing-session` / Chrome MCP) e não há
abas abertas às quais se conectar.

Opções de correção:

1. Use o navegador gerenciado:
   `openclaw browser --browser-profile openclaw start` (ou defina
   `browser.defaultProfile: "openclaw"`).
2. Mantenha o Chrome local em execução com pelo menos uma aba aberta e tente novamente com
   `--browser-profile user`.

Observações:

- `user` funciona somente no host. Em servidores Linux, contêineres ou hosts remotos, prefira
  perfis CDP.
- `user` e outros perfis `existing-session` compartilham as limitações atuais do Chrome MCP:
  somente ações orientadas por referências, um arquivo por upload, sem substituições de `timeoutMs`
  para caixas de diálogo, sem `wait --load networkidle` e sem `responsebody`, exportação para PDF,
  interceptação de downloads ou ações em lote.
- Perfis locais do driver `openclaw` atribuem `cdpPort`/`cdpUrl` automaticamente; defina-os
  manualmente somente para CDP remoto.
- Perfis CDP remotos aceitam `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) para a descoberta por `/json/version` ou WS(S) quando o serviço do navegador
  fornecer diretamente uma URL de socket do DevTools.

## Relacionado

- [Navegador](/pt-BR/tools/browser)
- [Login no navegador](/pt-BR/tools/browser-login)
- [Solução de problemas do navegador no WSL2](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
