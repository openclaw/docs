---
read_when:
    - Você quer que um agente controle o Chrome real em que você já está conectado usando seu celular
    - Você continua se deparando com o aviso "Allow remote debugging?" do Chrome sem ninguém na frente do computador
    - Você quer entender o modelo de segurança da tomada de controle do navegador por meio da extensão
summary: 'Extensão do Chrome: permita que o OpenClaw controle seu Chrome com a sessão iniciada sem solicitar depuração remota'
title: Extensão do Chrome
x-i18n:
    generated_at: "2026-07-12T15:48:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Extensão do Chrome

A extensão do OpenClaw para Chrome permite que um agente controle suas **abas do Chrome
com sessão iniciada** sem iniciar um navegador gerenciado separado e **sem** a
caixa de diálogo bloqueante "Allow remote debugging?" do Chrome.

Isso é importante quando você controla o OpenClaw por um telefone (Telegram, WhatsApp etc.):
o [perfil `user`](/pt-BR/tools/browser#profiles-openclaw-user-chrome) se conecta pela
porta de depuração remota do Chrome, o que exibe uma caixa de diálogo de consentimento
no desktop na qual ninguém pode clicar quando você está longe. Em vez disso, a extensão usa
a API `chrome.debugger`, portanto, o único aviso na página é o banner dispensável
"OpenClaw started debugging this browser" do Chrome.

Esse é o mesmo modelo usado pelas extensões do Chrome Claude, da Anthropic, e Codex,
da OpenAI.

## Como funciona

Três partes:

- **Serviço de controle do navegador** (Gateway ou host do Node): a API chamada pela
  ferramenta `browser`.
- **Relay da extensão** (WebSocket de loopback): um pequeno servidor que o serviço
  de controle inicia em `127.0.0.1`. Ele fornece ao OpenClaw um endpoint do Chrome
  DevTools Protocol e se comunica com a extensão. Ambos os lados se autenticam com
  um token local do host (veja abaixo).
- **Extensão do OpenClaw para Chrome** (MV3): conecta-se às abas com `chrome.debugger`,
  encaminha o tráfego CDP e gerencia o **grupo de abas do OpenClaw**.

O OpenClaw só vê e controla as abas que estão no **grupo de abas do OpenClaw**. O
grupo é o limite de consentimento: arraste uma aba para dentro dele para compartilhá-la,
arraste-a para fora (ou clique no botão da barra de ferramentas) para revogar o
acesso imediatamente.

## Instalação e pareamento

1. Exiba o caminho da extensão descompactada:

   ```bash
   openclaw browser extension path
   ```

2. Abra `chrome://extensions`, ative **Developer mode**, clique em **Load
   unpacked** e selecione o diretório exibido.

3. Exiba a string de pareamento:

   ```bash
   openclaw browser extension pair
   ```

4. Clique no ícone do OpenClaw na barra de ferramentas e cole a string de pareamento
   no pop-up. O selo muda para **ON** quando a extensão se conecta ao relay.

O token de pareamento é um **segredo local do host**, criado no primeiro uso e
armazenado em `credentials/` no diretório de estado (modo `0600`). Cada máquina
que executa um navegador — o host do Gateway e cada host de Node do navegador —
possui seu próprio token, portanto, nenhuma credencial precisa ser transferida
entre máquinas. Para substituí-lo, exclua o arquivo
`browser-extension-relay.secret` e faça o pareamento novamente.

## Como usar

Selecione o perfil `chrome` integrado em uma chamada da ferramenta `browser` ou
torne-o o padrão:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Compartilhe uma aba: clique no botão do OpenClaw na barra de ferramentas dessa
  aba (ela entrará no grupo de abas do OpenClaw) ou arraste qualquer aba para o grupo.
- O agente também pode abrir novas abas; elas entram automaticamente no grupo.
- Revogue o acesso: clique novamente no botão, arraste a aba para fora do grupo ou
  dispense o banner de depuração do Chrome. O agente perde imediatamente o acesso
  a essa aba.

## Remoto/entre máquinas

O Chrome não precisa ser executado no host do Gateway. Três topologias funcionam:

- **Mesmo host** (Gateway + Chrome em uma máquina): faça o pareamento nessa máquina
  com `openclaw browser extension pair`. O relay é restrito ao loopback.
- **Diretamente para um Gateway remoto** (Chrome em seu laptop, Gateway em um VPS e
  **nada mais no laptop**): no Gateway, execute
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  O comando exibe uma string `wss://…/browser/extension#<secret>`; carregue e
  faça o pareamento da extensão no laptop. A extensão se conecta **diretamente ao
  Gateway** por `wss://` — sem instalação do OpenClaw, Node, CLI ou porta de entrada
  aberta no laptop. Esse é o fluxo para hospedagem gerenciada.
- **Por meio de um host de Node do navegador** (Chrome em uma máquina que já executa
  um Node do OpenClaw): execute `pair` no Node e faça o pareamento localmente; o
  Gateway encaminha as ações do navegador ao Node pelo link autenticado existente
  desse Node.

O segredo de pareamento é específico de cada host (o do Gateway, no caso direto)
e é validado pela rota `/browser/extension` do Gateway. Para o fluxo direto,
disponibilize o Gateway por TLS (`wss://`) para que o segredo de pareamento e o
tráfego CDP sejam criptografados.
O segredo permanece no fragmento da URL da string de pareamento e é apresentado
durante o handshake do WebSocket como uma credencial de subprotocolo, portanto,
os logs normais de acesso do proxy não o recebem na URL da solicitação. Verifique
se qualquer proxy reverso preserva o cabeçalho padrão `Sec-WebSocket-Protocol`.

## Diagnóstico

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` relata a verificação do **relay da extensão do Chrome** como falha até
que o pop-up da extensão mostre **Connected**.

## Modelo de segurança

- O relay se vincula apenas ao loopback; ambos os lados do WebSocket são autenticados
  com o token derivado, e a origem do lado da extensão é verificada como
  `chrome-extension://`.
- O pareamento direto com o Gateway não aceita o token do relay na URL da solicitação;
  a extensão incluída o transporta na lista de subprotocolos do WebSocket.
- O agente só pode ver e controlar as abas no **grupo de abas do OpenClaw**. Suas
  outras abas permanecem privadas.
- Em comparação com o perfil `user` (Chrome MCP), que expõe todo o navegador com
  sessão iniciada após você aprovar a caixa de diálogo de depuração remota, a extensão
  mantém a superfície compartilhada limitada a um grupo de abas que você pode
  controlar rapidamente.

Veja também: [Navegador](/pt-BR/tools/browser) para consultar o modelo completo de perfis
e os perfis gerenciados `openclaw` e `user` do Chrome MCP.
