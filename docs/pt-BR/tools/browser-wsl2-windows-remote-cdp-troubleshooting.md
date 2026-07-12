---
read_when:
    - Executando o Gateway do OpenClaw no WSL2 enquanto o Chrome está no Windows
    - Observando erros sobrepostos do navegador/da interface de controle no WSL2 e no Windows
    - Como decidir entre o MCP do Chrome local ao host e o CDP remoto bruto em configurações com hosts separados
summary: Solucione problemas do Gateway no WSL2 + CDP remoto do Chrome no Windows em camadas
title: Solução de problemas do WSL2 + Windows + CDP remoto do Chrome
x-i18n:
    generated_at: "2026-07-12T00:26:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Na configuração comum com hosts separados, o OpenClaw Gateway é executado dentro do WSL2, o Chrome é executado
no Windows, e o controle do navegador precisa atravessar a fronteira entre WSL2 e Windows. Vários
problemas independentes podem surgir ao mesmo tempo (consulte a
[issue nº 39369](https://github.com/openclaw/openclaw/issues/39369)): o transporte
CDP, a segurança da origem da interface de controle e o token/emparelhamento podem falhar
separadamente, embora produzam erros aparentemente semelhantes. Percorra as camadas
abaixo em ordem, em vez de tentar adivinhar qual delas está com problema.

## Primeiro, escolha o modo de navegador correto

### Opção 1: CDP remoto direto do WSL2 para o Windows

Use um perfil de navegador remoto que aponte do WSL2 para um endpoint CDP do Chrome
no Windows. Escolha essa opção quando o Gateway permanecer dentro do WSL2, o Chrome for executado no
Windows e o controle do navegador precisar atravessar a fronteira entre WSL2 e Windows.

### Opção 2: Chrome MCP local ao host

Use o driver `existing-session` (perfil `user`) somente quando o Gateway for executado
no mesmo host que o Chrome, você quiser o estado local do navegador com sessão iniciada, não
precisar de transporte do navegador entre hosts e não precisar de `responsebody`,
exportação para PDF, interceptação de downloads ou ações em lote (os perfis do Chrome MCP não
oferecem suporte a esses recursos).

Para Gateway no WSL2 + Chrome no Windows, use CDP remoto direto. O Chrome MCP é
local ao host, não uma ponte entre WSL2 e Windows.

## Arquitetura funcional

- O WSL2 executa o Gateway em `127.0.0.1:18789`
- O Windows abre a interface de controle em um navegador normal em `http://127.0.0.1:18789/`
- O Chrome no Windows expõe um endpoint CDP na porta `9222`
- O WSL2 consegue acessar esse endpoint CDP do Windows
- O OpenClaw aponta um perfil de navegador para o endereço acessível pelo WSL2

## Regra essencial para a interface de controle

Quando a interface for aberta pelo Windows, use o localhost do Windows, a menos que você tenha uma
configuração HTTPS deliberada:

```text
http://127.0.0.1:18789/
```

Não use um IP da LAN como padrão. HTTP simples em um endereço da LAN ou da tailnet pode
acionar comportamentos de origem insegura/autenticação do dispositivo não relacionados ao próprio CDP. Consulte
[Interface de controle](/pt-BR/web/control-ui).

## Valide em camadas

Siga de cima para baixo; não pule etapas. Corrigir uma camada ainda pode deixar
visível outro erro de uma camada posterior.

### Camada 1: verifique se o Chrome está disponibilizando CDP no Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

O Chrome 136 e versões posteriores ignoram as opções de linha de comando de depuração remota para o
diretório de dados padrão do Chrome. Use um diretório de dados separado e não padrão, conforme
mostrado acima. Consulte a
[alteração de segurança da depuração remota](https://developer.chrome.com/blog/remote-debugging-port)
do Chrome.
Isso não torna o perfil normal do Chrome com sessão iniciada controlável remotamente.

No Windows, verifique primeiro o próprio Chrome:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Se isso falhar, diagnostique os listeners do Windows abaixo. O OpenClaw ainda não é o
problema.

#### Diagnostique IPv4 e IPv6 antes de alterar o portproxy

O Chromium tenta primeiro associar a depuração remota a `127.0.0.1` e só recorre a
`[::1]` se a associação IPv4 falhar. Uma regra `v4tov4` persistente que escute em
`127.0.0.1:9222` pode ocupar esse endpoint antes que o Chrome seja iniciado. O Chrome então
recorre a `[::1]:9222`, enquanto a regra antiga encaminha o tráfego IPv4 de volta para
seu próprio listener e retorna uma resposta vazia.

Verifique os listeners e as regras de proxy reais no Windows, em vez de deduzi-los
pela versão do Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Use `tasklist /fi "PID eq <PID>"` para cada PID retornado por `netstat`.

- Se `chrome.exe` responder em `127.0.0.1`, remova qualquer regra portproxy que também
  escute em `127.0.0.1:9222`. Encaminhe somente o endereço do adaptador do Windows acessível
  pelo WSL2 para `127.0.0.1`.
- Se `chrome.exe` responder somente em `[::1]`, aponte o listener acessível pelo WSL2 para
  `::1` usando `v4tov6`, em vez de encaminhar para um endereço IPv4 não utilizado:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Associe o listener ao endereço do adaptador necessário para o WSL2. Não exponha a porta
CDP em `0.0.0.0`, em um endereço da LAN ou em um endereço da tailnet: o CDP concede controle da
sessão do navegador.

### Camada 2: verifique se o WSL2 consegue acessar esse endpoint do Windows

No WSL2, teste o endereço exato que você pretende usar em `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Resultado esperado:

- `/json/version` retorna JSON com metadados de Browser / Protocol-Version
- `/json/list` retorna JSON (um array vazio é aceitável se nenhuma página estiver aberta)

Se isso falhar, o Windows ainda não está expondo a porta ao WSL2, o endereço está
incorreto para o lado do WSL2 ou está faltando firewall/encaminhamento de porta/proxy. Corrija
isso antes de alterar a configuração do OpenClaw.

### Camada 3: configure o perfil de navegador correto

Aponte o OpenClaw para o endereço acessível pelo WSL2:

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

- use o endereço acessível pelo WSL2, não um endereço que só funcione no Windows
- mantenha `attachOnly: true` para navegadores gerenciados externamente
- `cdpUrl` pode usar `http://`, `https://`, `ws://` ou `wss://`
- use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`
- use WS(S) somente quando o provedor do navegador fornecer uma URL direta do socket
  DevTools
- teste a mesma URL com `curl` antes de esperar que o OpenClaw funcione

### Camada 4: verifique separadamente a camada da interface de controle

Abra `http://127.0.0.1:18789/` no Windows e verifique:

- se a origem da página corresponde ao esperado por `gateway.controlUi.allowedOrigins`
- se a autenticação por token ou o emparelhamento está configurado corretamente
- se você não está diagnosticando um problema de autenticação da interface de controle como se fosse um problema do
  navegador

Página útil: [Interface de controle](/pt-BR/web/control-ui).

### Camada 5: verifique o controle do navegador de ponta a ponta

No WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Resultado esperado:

- a aba é aberta no Chrome do Windows
- `browser tabs` retorna o destino
- as ações posteriores (`snapshot`, `screenshot`, `navigate`) funcionam no mesmo
  perfil

## Erros comuns que podem induzir ao diagnóstico incorreto

| Mensagem                                                                                | Significado                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | problema de origem/contexto seguro da interface, não de transporte CDP                                                                                                                       |
| `token_missing`                                                                         | problema de configuração da autenticação                                                                                                                                                    |
| `pairing required`                                                                      | problema de aprovação do dispositivo                                                                                                                                                        |
| `Remote CDP for profile "remote" is not reachable`                                      | o WSL2 não consegue acessar o `cdpUrl` configurado                                                                                                                                           |
| resposta CDP vazia / `other side closed` por meio de um portproxy                       | incompatibilidade do listener do Windows ou um loop para si próprio; inspecione ambas as famílias de loopback e `netsh interface portproxy show all`                                         |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | o endpoint HTTP respondeu, mas não foi possível abrir o WebSocket do DevTools                                                                                                                |
| viewport / modo escuro / localidade / substituições offline obsoletas após uma sessão remota | execute `openclaw browser --browser-profile remote stop` para fechar a sessão e liberar a conexão Playwright/CDP armazenada em cache sem reiniciar o Gateway nem o navegador externo          |
| tempo limite próximo de `remoteCdpTimeoutMs` (padrão de 1500 ms)                        | geralmente ainda indica acessibilidade do CDP ou um endpoint remoto lento/inacessível                                                                                                        |
| `Playwright page enumeration timed out after 3000ms`                                    | o CDP remoto foi conectado, mas a leitura persistente das abas ficou bloqueada; o prazo é o maior valor entre `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs`                            |
| `No Chrome tabs found for profile="user"`                                               | foi selecionado um perfil local do Chrome MCP em um ambiente sem abas disponíveis localmente no host                                                                                         |

## Lista rápida de triagem

1. Windows: qual endereço, `127.0.0.1` ou `[::1]`, responde em `/json/version`, e
   esse listener pertence a `chrome.exe`?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` funciona?
3. Configuração do OpenClaw: `browser.profiles.<name>.cdpUrl` usa exatamente esse
   endereço acessível pelo WSL2?
4. Interface de controle: você está abrindo `http://127.0.0.1:18789/` em vez de um IP da LAN?
5. Você está tentando usar `existing-session` entre WSL2 e Windows em vez
   de CDP remoto direto?

Primeiro, verifique localmente o endpoint do Chrome no Windows; depois, verifique o mesmo endpoint
no WSL2; somente então diagnostique a configuração do OpenClaw ou a autenticação da interface de controle.

## Relacionado

- [Navegador](/pt-BR/tools/browser)
- [Login no navegador](/pt-BR/tools/browser-login)
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)
