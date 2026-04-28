---
read_when:
    - Running OpenClaw Gateway in WSL2 while Chrome lives on Windows
    - Vendo erros sobrepostos de navegador/control-ui entre WSL2 e Windows
    - Decidindo entre Chrome MCP local no host e CDP remoto bruto em configurações de host dividido
summary: Solucionar problemas do Gateway no WSL2 + Chrome remoto no Windows em camadas
title: Solução de problemas de WSL2 + Windows + Chrome remoto CDP
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T06:15:18Z"
  model: gpt-5.4
  provider: openai
  source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
  source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
  workflow: 15
---

Este guia cobre a configuração comum de host dividido em que:

- o Gateway OpenClaw roda dentro do WSL2
- o Chrome roda no Windows
- o controle do navegador precisa atravessar o limite WSL2/Windows

Ele também cobre o padrão de falha em camadas da [issue #39369](https://github.com/openclaw/openclaw/issues/39369): vários problemas independentes podem aparecer ao mesmo tempo, o que faz a camada errada parecer quebrada primeiro.

## Escolha primeiro o modo de navegador correto

Você tem dois padrões válidos:

### Opção 1: CDP remoto bruto do WSL2 para o Windows

Use um perfil remoto de navegador que aponte do WSL2 para um endpoint CDP do Chrome no Windows.

Escolha isso quando:

- o Gateway permanece dentro do WSL2
- o Chrome roda no Windows
- você precisa que o controle do navegador atravesse o limite WSL2/Windows

### Opção 2: Chrome MCP local no host

Use `existing-session` / `user` apenas quando o próprio Gateway roda no mesmo host que o Chrome.

Escolha isso quando:

- OpenClaw e Chrome estão na mesma máquina
- você quer o estado local do navegador já autenticado
- você não precisa de transporte de navegador entre hosts
- você não precisa de rotas avançadas exclusivas de CDP bruto/gerenciado, como `responsebody`, exportação de PDF, interceptação de download ou ações em lote

Para Gateway no WSL2 + Chrome no Windows, prefira CDP remoto bruto. Chrome MCP é local ao host, não uma bridge WSL2-para-Windows.

## Arquitetura funcional

Formato de referência:

- o WSL2 roda o Gateway em `127.0.0.1:18789`
- o Windows abre a Control UI em um navegador normal em `http://127.0.0.1:18789/`
- o Chrome no Windows expõe um endpoint CDP na porta `9222`
- o WSL2 consegue alcançar esse endpoint CDP do Windows
- o OpenClaw aponta um perfil de navegador para o endereço que é alcançável a partir do WSL2

## Por que essa configuração é confusa

Várias falhas podem se sobrepor:

- o WSL2 não consegue alcançar o endpoint CDP do Windows
- a Control UI é aberta a partir de uma origem não segura
- `gateway.controlUi.allowedOrigins` não corresponde à origem da página
- token ou pairing estão ausentes
- o perfil de navegador aponta para o endereço errado

Por causa disso, corrigir uma camada ainda pode deixar um erro diferente visível.

## Regra crítica para a Control UI

Quando a UI é aberta a partir do Windows, use localhost do Windows, a menos que você tenha uma configuração deliberada com HTTPS.

Use:

`http://127.0.0.1:18789/`

Não use por padrão um IP de LAN para a Control UI. HTTP simples em um endereço de LAN ou tailnet pode acionar comportamento de origem insegura/autenticação de dispositivo que não tem relação com o próprio CDP. Consulte [Control UI](/pt-BR/web/control-ui).

## Valide em camadas

Trabalhe de cima para baixo. Não pule etapas.

### Camada 1: verificar se o Chrome está servindo CDP no Windows

Inicie o Chrome no Windows com depuração remota ativada:

```powershell
chrome.exe --remote-debugging-port=9222
```

No Windows, verifique primeiro o próprio Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Se isso falhar no Windows, o problema ainda não é o OpenClaw.

### Camada 2: verificar se o WSL2 consegue alcançar esse endpoint do Windows

No WSL2, teste o endereço exato que você planeja usar em `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Bom resultado:

- `/json/version` retorna JSON com metadados Browser / Protocol-Version
- `/json/list` retorna JSON (array vazio é aceitável se não houver páginas abertas)

Se isso falhar:

- o Windows ainda não está expondo a porta para o WSL2
- o endereço está errado para o lado do WSL2
- firewall / encaminhamento de porta / proxy local ainda estão ausentes

Corrija isso antes de mexer na configuração do OpenClaw.

### Camada 3: configurar o perfil de navegador correto

Para CDP remoto bruto, aponte o OpenClaw para o endereço alcançável a partir do WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Observações:

- use o endereço alcançável a partir do WSL2, não o que só funciona no Windows
- mantenha `attachOnly: true` para navegadores gerenciados externamente
- `cdpUrl` pode ser `http://`, `https://`, `ws://` ou `wss://`
- use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`
- use WS(S) apenas quando o provedor do navegador fornecer uma URL direta do socket DevTools
- teste a mesma URL com `curl` antes de esperar que o OpenClaw funcione

### Camada 4: verificar separadamente a camada da Control UI

Abra a UI no Windows:

`http://127.0.0.1:18789/`

Depois verifique:

- a origem da página corresponde ao que `gateway.controlUi.allowedOrigins` espera
- autenticação por token ou pairing está configurada corretamente
- você não está depurando um problema de autenticação da Control UI como se fosse um problema do navegador

Página útil:

- [Control UI](/pt-BR/web/control-ui)

### Camada 5: verificar o controle de navegador ponta a ponta

No WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Bom resultado:

- a aba abre no Chrome do Windows
- `openclaw browser tabs` retorna o target
- ações posteriores (`snapshot`, `screenshot`, `navigate`) funcionam a partir do mesmo perfil

## Erros enganosos comuns

Trate cada mensagem como uma pista específica de camada:

- `control-ui-insecure-auth`
  - problema de origem da UI / contexto seguro, não de transporte CDP
- `token_missing`
  - problema de configuração de autenticação
- `pairing required`
  - problema de aprovação de dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - o WSL2 não consegue alcançar o `cdpUrl` configurado
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - o endpoint HTTP respondeu, mas o WebSocket DevTools ainda não pôde ser aberto
- substituições persistentes de viewport / modo escuro / locale / offline após uma sessão remota
  - execute `openclaw browser stop --browser-profile remote`
  - isso fecha a sessão ativa de controle e libera o estado de emulação Playwright/CDP sem reiniciar o gateway nem o navegador externo
- `gateway timeout after 1500ms`
  - muitas vezes ainda é problema de alcançabilidade do CDP ou um endpoint remoto lento/inacessível
- `No Chrome tabs found for profile="user"`
  - perfil local Chrome MCP selecionado onde não há abas locais disponíveis no host

## Checklist rápido de triagem

1. Windows: `curl http://127.0.0.1:9222/json/version` funciona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funciona?
3. Configuração do OpenClaw: `browser.profiles.<name>.cdpUrl` usa exatamente esse endereço alcançável a partir do WSL2?
4. Control UI: você está abrindo `http://127.0.0.1:18789/` em vez de um IP de LAN?
5. Você está tentando usar `existing-session` entre WSL2 e Windows em vez de CDP remoto bruto?

## Conclusão prática

A configuração normalmente é viável. A parte difícil é que transporte do navegador, segurança de origem da Control UI e token/pairing podem falhar independentemente, embora pareçam semelhantes do lado do usuário.

Em caso de dúvida:

- primeiro verifique localmente o endpoint do Chrome no Windows
- depois verifique o mesmo endpoint a partir do WSL2
- só então depure a configuração do OpenClaw ou a autenticação da Control UI

## Relacionado

- [Browser](/pt-BR/tools/browser)
- [Browser login](/pt-BR/tools/browser-login)
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
