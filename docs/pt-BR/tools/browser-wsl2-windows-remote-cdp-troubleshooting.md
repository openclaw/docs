---
read_when:
    - Executando o OpenClaw Gateway no WSL2 enquanto o Chrome fica no Windows
    - Vendo erros sobrepostos de navegador/control-ui no WSL2 e no Windows
    - Decidindo entre o Chrome MCP local ao host e o CDP remoto direto em configurações com hosts separados
summary: Solucionar problemas do Gateway WSL2 + CDP remoto do Chrome no Windows por camadas
title: Solução de problemas do WSL2 + Windows + CDP remoto do Chrome
x-i18n:
    generated_at: "2026-04-30T10:10:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Na configuração comum de host dividido, o OpenClaw Gateway roda dentro do WSL2, o Chrome roda no Windows, e o controle do navegador precisa atravessar a fronteira entre WSL2 e Windows. O padrão de falha em camadas de [issue #39369](https://github.com/openclaw/openclaw/issues/39369) significa que vários problemas independentes podem aparecer ao mesmo tempo, o que faz a camada errada parecer quebrada primeiro.

## Escolha primeiro o modo de navegador correto

Você tem dois padrões válidos:

### Opção 1: CDP remoto bruto do WSL2 para o Windows

Use um perfil de navegador remoto que aponta do WSL2 para um endpoint CDP do Chrome no Windows.

Escolha isso quando:

- o Gateway permanece dentro do WSL2
- o Chrome roda no Windows
- você precisa que o controle do navegador atravesse a fronteira WSL2/Windows

### Opção 2: MCP do Chrome local ao host

Use `existing-session` / `user` somente quando o próprio Gateway roda no mesmo host que o Chrome.

Escolha isso quando:

- o OpenClaw e o Chrome estão na mesma máquina
- você quer o estado do navegador local com sessão iniciada
- você não precisa de transporte de navegador entre hosts
- você não precisa de rotas avançadas gerenciadas ou exclusivas de CDP bruto, como `responsebody`, exportação para PDF, interceptação de downloads ou ações em lote

Para Gateway no WSL2 + Chrome no Windows, prefira CDP remoto bruto. O MCP do Chrome é local ao host, não uma ponte do WSL2 para o Windows.

## Arquitetura funcional

Formato de referência:

- o WSL2 executa o Gateway em `127.0.0.1:18789`
- o Windows abre a Interface de Controle em um navegador normal em `http://127.0.0.1:18789/`
- o Chrome no Windows expõe um endpoint CDP na porta `9222`
- o WSL2 consegue alcançar esse endpoint CDP do Windows
- o OpenClaw aponta um perfil de navegador para o endereço que é alcançável a partir do WSL2

## Por que essa configuração é confusa

Várias falhas podem se sobrepor:

- o WSL2 não consegue alcançar o endpoint CDP do Windows
- a Interface de Controle é aberta a partir de uma origem não segura
- `gateway.controlUi.allowedOrigins` não corresponde à origem da página
- token ou pareamento está ausente
- o perfil de navegador aponta para o endereço errado

Por isso, corrigir uma camada ainda pode deixar um erro diferente visível.

## Regra crítica para a Interface de Controle

Quando a UI for aberta a partir do Windows, use o localhost do Windows, a menos que você tenha uma configuração HTTPS deliberada.

Use:

`http://127.0.0.1:18789/`

Não use por padrão um IP de LAN para a Interface de Controle. HTTP simples em uma LAN ou endereço de tailnet pode acionar comportamento de origem insegura/autenticação de dispositivo que não está relacionado ao CDP em si. Veja [Interface de Controle](/pt-BR/web/control-ui).

## Valide em camadas

Trabalhe de cima para baixo. Não pule etapas.

### Camada 1: Verifique se o Chrome está servindo CDP no Windows

Inicie o Chrome no Windows com depuração remota habilitada:

```powershell
chrome.exe --remote-debugging-port=9222
```

A partir do Windows, verifique primeiro o próprio Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Se isso falhar no Windows, o OpenClaw ainda não é o problema.

### Camada 2: Verifique se o WSL2 consegue alcançar esse endpoint do Windows

A partir do WSL2, teste o endereço exato que você planeja usar em `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Resultado bom:

- `/json/version` retorna JSON com metadados de Browser / Protocol-Version
- `/json/list` retorna JSON (um array vazio não tem problema se nenhuma página estiver aberta)

Se isso falhar:

- o Windows ainda não está expondo a porta para o WSL2
- o endereço está errado para o lado do WSL2
- firewall / encaminhamento de porta / proxy local ainda está ausente

Corrija isso antes de tocar na configuração do OpenClaw.

### Camada 3: Configure o perfil de navegador correto

Para CDP remoto bruto, aponte o OpenClaw para o endereço que é alcançável a partir do WSL2:

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

- use o endereço alcançável pelo WSL2, não algo que só funciona no Windows
- mantenha `attachOnly: true` para navegadores gerenciados externamente
- `cdpUrl` pode ser `http://`, `https://`, `ws://` ou `wss://`
- use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`
- use WS(S) somente quando o provedor do navegador fornecer uma URL direta de socket DevTools
- teste a mesma URL com `curl` antes de esperar que o OpenClaw funcione

### Camada 4: Verifique a camada da Interface de Controle separadamente

Abra a UI a partir do Windows:

`http://127.0.0.1:18789/`

Depois verifique:

- a origem da página corresponde ao que `gateway.controlUi.allowedOrigins` espera
- autenticação por token ou pareamento está configurado corretamente
- você não está depurando um problema de autenticação da Interface de Controle como se fosse um problema de navegador

Página útil:

- [Interface de Controle](/pt-BR/web/control-ui)

### Camada 5: Verifique o controle de navegador ponta a ponta

A partir do WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Resultado bom:

- a aba abre no Chrome do Windows
- `openclaw browser tabs` retorna o alvo
- ações posteriores (`snapshot`, `screenshot`, `navigate`) funcionam a partir do mesmo perfil

## Erros enganosos comuns

Trate cada mensagem como uma pista específica de camada:

- `control-ui-insecure-auth`
  - problema de origem da UI / contexto seguro, não um problema de transporte CDP
- `token_missing`
  - problema de configuração de autenticação
- `pairing required`
  - problema de aprovação de dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - o WSL2 não consegue alcançar o `cdpUrl` configurado
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - o endpoint HTTP respondeu, mas o WebSocket do DevTools ainda não pôde ser aberto
- substituições obsoletas de viewport / modo escuro / localidade / offline após uma sessão remota
  - execute `openclaw browser stop --browser-profile remote`
  - isso fecha a sessão de controle ativa e libera o estado de emulação Playwright/CDP sem reiniciar o gateway ou o navegador externo
- `gateway timeout after 1500ms`
  - muitas vezes ainda é alcançabilidade do CDP ou um endpoint remoto lento/inalcançável
- `No Chrome tabs found for profile="user"`
  - perfil MCP do Chrome local selecionado onde não há abas locais ao host disponíveis

## Checklist de triagem rápida

1. Windows: `curl http://127.0.0.1:9222/json/version` funciona?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funciona?
3. Configuração do OpenClaw: `browser.profiles.<name>.cdpUrl` usa exatamente esse endereço alcançável pelo WSL2?
4. Interface de Controle: você está abrindo `http://127.0.0.1:18789/` em vez de um IP de LAN?
5. Você está tentando usar `existing-session` entre WSL2 e Windows em vez de CDP remoto bruto?

## Conclusão prática

A configuração geralmente é viável. A parte difícil é que o transporte do navegador, a segurança de origem da Interface de Controle e token/pareamento podem falhar independentemente, mesmo parecendo semelhantes do lado do usuário.

Em caso de dúvida:

- verifique primeiro o endpoint do Chrome no Windows localmente
- verifique o mesmo endpoint a partir do WSL2 em seguida
- só então depure a configuração do OpenClaw ou a autenticação da Interface de Controle

## Relacionados

- [Navegador](/pt-BR/tools/browser)
- [Login do navegador](/pt-BR/tools/browser-login)
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
