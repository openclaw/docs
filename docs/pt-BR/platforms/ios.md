---
read_when:
    - Emparelhando ou reconectando o nó iOS
    - Executando o app iOS a partir do código-fonte
    - Depuração da descoberta de Gateway ou comandos de canvas
summary: 'App de nó iOS: conexão com o Gateway, emparelhamento, canvas e solução de problemas'
title: Aplicativo iOS
x-i18n:
    generated_at: "2026-06-27T17:42:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidade: builds do app para iPhone são distribuídas pelos canais da Apple quando habilitadas para uma release. Builds de desenvolvimento local também podem ser executadas a partir do código-fonte.

## O que ele faz

- Conecta-se a um Gateway via WebSocket (LAN ou tailnet).
- Expõe capacidades do nó: Canvas, snapshot de tela, captura de câmera, localização, modo Talk, ativação por voz.
- Recebe comandos `node.invoke` e reporta eventos de status do nó.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (fallback).

## Início rápido (emparelhar + conectar)

1. Inicie o Gateway:

```bash
openclaw gateway --port 18789
```

2. No app iOS, abra Settings e escolha um gateway descoberto (ou habilite Manual Host e informe host/porta).

3. Aprove a solicitação de emparelhamento no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar emparelhar novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o nó iOS sempre se conectar a partir de uma sub-rede estritamente controlada, você
pode optar pela aprovação automática de nós no primeiro uso com CIDRs explícitos ou IPs exatos:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Isso fica desabilitado por padrão. Aplica-se apenas a emparelhamentos novos com `role: node` e
sem escopos solicitados. Emparelhamento de operador/navegador e qualquer alteração de função, escopo, metadados ou
chave pública ainda exigem aprovação manual.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push com relay para builds oficiais

Builds iOS distribuídas oficialmente usam o relay externo de push em vez de publicar o token APNs bruto
para o gateway.

Builds oficiais/TestFlight da faixa pública de release da App Store usam o relay hospedado em `https://ios-push-relay.openclaw.ai`.

Implantações de relay personalizadas exigem um caminho de build/implantação iOS deliberadamente separado cuja URL de relay corresponda à URL de relay do gateway. A faixa pública de release da App Store não aceita substituições personalizadas de URL de relay. Se você estiver usando uma build com relay personalizado, configure a URL de relay correspondente no gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Como o fluxo funciona:

- O app iOS registra-se no relay usando App Attest e um JWS de transação de app do StoreKit.
- O relay retorna um identificador opaco de relay mais uma concessão de envio com escopo de registro.
- O app iOS busca a identidade do gateway emparelhado e a inclui no registro do relay, então o registro com suporte de relay é delegado a esse gateway específico.
- O app encaminha esse registro com suporte de relay para o gateway emparelhado com `push.apns.register`.
- O gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e sinais de ativação.
- URLs de relay personalizadas do gateway devem corresponder à URL de relay incorporada na build iOS.
- Se o app se conectar posteriormente a outro gateway ou a uma build com uma URL base de relay diferente, ele atualiza o registro do relay em vez de reutilizar o vínculo antigo.

O que o gateway **não** precisa para esse caminho:

- Nenhum token de relay para toda a implantação.
- Nenhuma chave APNs direta para envios oficiais/TestFlight com suporte de relay.

Fluxo esperado do operador:

1. Instale a build iOS oficial/TestFlight.
2. Opcional: configure `gateway.push.apns.relay.baseUrl` no gateway somente ao usar uma build de relay personalizado deliberadamente separada.
3. Emparelhe o app ao gateway e deixe-o concluir a conexão.
4. O app publica `push.apns.register` automaticamente depois que tiver um token APNs, a sessão do operador estiver conectada e o registro no relay for bem-sucedido.
5. Depois disso, `push.test`, ativações de reconexão e sinais de ativação podem usar o registro armazenado com suporte de relay.

## Beacons de atividade em segundo plano

Quando o iOS desperta o app por um push silencioso, atualização em segundo plano ou evento de localização significativa, o app
tenta uma reconexão curta do nó e então chama `node.event` com `event: "node.presence.alive"`.
O gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do nó/dispositivo emparelhado somente
depois que a identidade autenticada do dispositivo de nó é conhecida.

O app trata uma ativação em segundo plano como registrada com sucesso somente quando a resposta do gateway inclui
`handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é
compatível, mas não conta como uma atualização durável de último visto.

Nota de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como uma substituição temporária de env para o gateway.
- A faixa pública de release da App Store rejeita `OPENCLAW_PUSH_RELAY_BASE_URL` para builds iOS.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que APNs direto no gateway não consegue oferecer para
builds iOS oficiais:

- Somente builds iOS genuínas do OpenClaw distribuídas pela Apple podem usar o relay hospedado.
- Um gateway pode enviar pushes com suporte de relay somente para dispositivos iOS emparelhados com esse gateway específico.

Salto a salto:

1. `iOS app -> gateway`
   - O app primeiro emparelha com o gateway por meio do fluxo normal de autenticação do Gateway.
   - Isso dá ao app uma sessão autenticada de nó mais uma sessão autenticada de operador.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `iOS app -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui prova do App Attest mais um JWS de transação de app do StoreKit.
   - O relay valida o ID do bundle, a prova do App Attest e a prova de distribuição da Apple, e exige o
     caminho de distribuição oficial/produção.
   - Isso é o que bloqueia builds locais do Xcode/desenvolvimento de usar o relay hospedado. Uma build local pode ser
     assinada, mas ela não satisfaz a prova de distribuição oficial da Apple esperada pelo relay.

3. `gateway identity delegation`
   - Antes do registro no relay, o app busca a identidade do gateway emparelhado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway no payload de registro do relay.
   - O relay retorna um identificador de relay e uma concessão de envio com escopo de registro delegados
     a essa identidade do gateway.

4. `gateway -> relay`
   - O gateway armazena o identificador de relay e a concessão de envio de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e sinais de ativação, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a concessão de envio armazenada quanto a assinatura do gateway contra a identidade
     de gateway delegada no registro.
   - Outro gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.

5. `relay -> APNs`
   - O relay possui as credenciais APNs de produção e o token APNs bruto da build oficial.
   - O gateway nunca armazena o token APNs bruto para builds oficiais com suporte de relay.
   - O relay envia o push final para o APNs em nome do gateway emparelhado.

Por que este design foi criado:

- Para manter credenciais APNs de produção fora dos gateways dos usuários.
- Para evitar armazenar tokens APNs brutos de builds oficiais no gateway.
- Para permitir o uso do relay hospedado somente por builds oficiais/TestFlight do OpenClaw.
- Para impedir que um gateway envie pushes de ativação para dispositivos iOS pertencentes a outro gateway.

Builds locais/manuais permanecem em APNs direto. Se você estiver testando essas builds sem o relay, o
gateway ainda precisa de credenciais APNs diretas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de env de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas
autenticação da App Store Connect / TestFlight, como `APP_STORE_CONNECT_KEY_ID` e
`APP_STORE_CONNECT_ISSUER_ID`; ele não configura entrega APNs direta para builds iOS locais.

Armazenamento recomendado no host do gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Não faça commit do arquivo `.p8` nem o coloque no checkout do repo.

## Caminhos de descoberta

### Bonjour (LAN)

O app iOS navega por `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente a partir de `local.`;
a descoberta entre redes pode usar o domínio de área ampla configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e DNS dividido do Tailscale.
Veja [Bonjour](/pt-BR/gateway/bonjour) para o exemplo de CoreDNS.

### Host/porta manual

Em Settings, habilite **Manual Host** e informe o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O nó iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- O host de canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido a partir do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
- O nó iOS mantém o scaffold integrado como a visualização padrão conectada. `canvas.a2ui.push` e `canvas.a2ui.reset` usam a página A2UI empacotada e pertencente ao app.
- Páginas A2UI remotas do Gateway são somente renderização no iOS; ações de botão A2UI nativas são aceitas somente de páginas empacotadas e pertencentes ao app.
- Retorne ao scaffold integrado com `canvas.navigate` e `{"url":""}`.

## Relação com Computer Use

O app iOS é uma superfície móvel de nó, não um backend do Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controlam uma área de trabalho macOS local por meio de ferramentas
MCP; o app iOS expõe capacidades do iPhone por meio de comandos de nó do OpenClaw
como `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Agentes ainda podem operar o app iOS pelo OpenClaw invocando comandos de nó,
mas essas chamadas passam pelo protocolo de nó do gateway e seguem os limites de
primeiro plano/segundo plano do iOS. Use [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
para controle de desktop local e esta página para capacidades de nó iOS.

### Eval / snapshot do Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo Talk

- Ativação por voz e modo Talk estão disponíveis em Settings.
- Nós iOS compatíveis com Talk anunciam a capacidade `talk` e podem declarar
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`;
  o Gateway permite esses comandos push-to-talk por padrão para nós confiáveis
  compatíveis com Talk.
- O iOS pode suspender áudio em segundo plano; trate recursos de voz como melhor esforço quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_UNAVAILABLE`: a página A2UI empacotada não estava acessível na WebView do app; mantenha o app em primeiro plano na aba Screen e tente novamente.
- Prompt de emparelhamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- Reconexão falha após reinstalar: o token de emparelhamento do Keychain foi apagado; emparelhe o nó novamente.

## Documentos relacionados

- [Emparelhamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
