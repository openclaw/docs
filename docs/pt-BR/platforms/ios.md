---
read_when:
    - Emparelhar ou reconectar o Node iOS
    - Executando o app iOS a partir do código-fonte
    - Depuração da descoberta do Gateway ou de comandos da tela
summary: 'app de nó iOS: conectar ao Gateway, pareamento, tela e solução de problemas'
title: Aplicativo iOS
x-i18n:
    generated_at: "2026-05-06T06:03:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidade: prévia interna. O app iOS ainda não é distribuído publicamente.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe capacidades de Node: Canvas, captura de tela, captura de câmera, Localização, modo Talk, ativação por voz.
- Recebe comandos `node.invoke` e relata eventos de status do Node.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (fallback).

## Início rápido (parear + conectar)

1. Inicie o Gateway:

```bash
openclaw gateway --port 18789
```

2. No app iOS, abra Ajustes e escolha um gateway descoberto (ou ative Host Manual e informe host/porta).

3. Aprove a solicitação de pareamento no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o Node iOS sempre se conectar a partir de uma sub-rede rigorosamente controlada, você
pode optar pela aprovação automática de Node no primeiro uso com CIDRs explícitos ou IPs exatos:

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

Isso fica desativado por padrão. Aplica-se apenas ao pareamento novo de `role: node` sem
escopos solicitados. Pareamento de operador/navegador e qualquer alteração de função, escopo, metadados ou
chave pública ainda exige aprovação manual.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push com relay para builds oficiais

Builds iOS oficiais distribuídos usam o relay de push externo em vez de publicar o token bruto de APNs
para o gateway.

Requisito no lado do Gateway:

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

- O app iOS registra-se no relay usando App Attest e um JWS de transação do app StoreKit.
- O relay retorna um identificador opaco de relay mais uma concessão de envio com escopo de registro.
- O app iOS busca a identidade do gateway pareado e a inclui no registro do relay, de modo que o registro com relay seja delegado a esse gateway específico.
- O app encaminha esse registro com relay ao gateway pareado com `push.apns.register`.
- O gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e nudges de ativação.
- A URL base de relay do gateway deve corresponder à URL de relay embutida no build iOS oficial/TestFlight.
- Se depois o app se conectar a outro gateway ou a um build com outra URL base de relay, ele atualiza o registro de relay em vez de reutilizar a vinculação antiga.

O que o gateway **não** precisa para esse caminho:

- Nenhum token de relay para toda a implantação.
- Nenhuma chave APNs direta para envios oficiais/TestFlight com relay.

Fluxo esperado do operador:

1. Instale o build iOS oficial/TestFlight.
2. Defina `gateway.push.apns.relay.baseUrl` no gateway.
3. Pareie o app com o gateway e deixe-o concluir a conexão.
4. O app publica `push.apns.register` automaticamente depois de ter um token APNs, a sessão do operador estar conectada e o registro de relay ser bem-sucedido.
5. Depois disso, `push.test`, ativações de reconexão e nudges de ativação podem usar o registro armazenado com relay.

## Beacons de atividade em segundo plano

Quando o iOS ativa o app por um push silencioso, atualização em segundo plano ou evento de localização significativa, o app
tenta uma reconexão curta do Node e depois chama `node.event` com `event: "node.presence.alive"`.
O gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do Node/dispositivo pareado somente
depois que a identidade autenticada do dispositivo Node é conhecida.

O app trata uma ativação em segundo plano como registrada com sucesso somente quando a resposta do gateway inclui
`handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é
compatível, mas não conta como uma atualização durável de último visto.

Nota de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como substituição temporária por env para o gateway.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que APNs direto no gateway não consegue oferecer para
builds iOS oficiais:

- Somente builds iOS genuínos do OpenClaw distribuídos pela Apple podem usar o relay hospedado.
- Um gateway pode enviar pushes com relay somente para dispositivos iOS que foram pareados com esse gateway específico.

Etapa por etapa:

1. `iOS app -> gateway`
   - O app primeiro pareia com o gateway pelo fluxo normal de autenticação do Gateway.
   - Isso fornece ao app uma sessão autenticada de Node mais uma sessão autenticada de operador.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `iOS app -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui prova do App Attest mais um JWS de transação do app StoreKit.
   - O relay valida o ID do pacote, a prova do App Attest e a prova de distribuição da Apple, e exige o
     caminho de distribuição oficial/produção.
   - É isso que bloqueia builds locais do Xcode/dev de usar o relay hospedado. Um build local pode ser
     assinado, mas não satisfaz a prova de distribuição oficial da Apple esperada pelo relay.

3. `delegação de identidade do gateway`
   - Antes do registro no relay, o app busca a identidade do gateway pareado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway no payload de registro do relay.
   - O relay retorna um identificador de relay e uma concessão de envio com escopo de registro que são delegados a
     essa identidade do gateway.

4. `gateway -> relay`
   - O gateway armazena o identificador de relay e a concessão de envio de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e nudges de ativação, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a concessão de envio armazenada quanto a assinatura do gateway em relação à identidade
     do gateway delegada no registro.
   - Outro gateway não pode reutilizar esse registro armazenado, mesmo que obtenha o identificador de alguma forma.

5. `relay -> APNs`
   - O relay é proprietário das credenciais APNs de produção e do token bruto de APNs para o build oficial.
   - O gateway nunca armazena o token bruto de APNs para builds oficiais com relay.
   - O relay envia o push final para APNs em nome do gateway pareado.

Por que esse design foi criado:

- Para manter as credenciais APNs de produção fora dos gateways dos usuários.
- Para evitar armazenar tokens APNs brutos de builds oficiais no gateway.
- Para permitir o uso do relay hospedado somente por builds oficiais/TestFlight do OpenClaw.
- Para impedir que um gateway envie pushes de ativação para dispositivos iOS pertencentes a outro gateway.

Builds locais/manuais continuam usando APNs direto. Se você estiver testando esses builds sem o relay, o
gateway ainda precisará de credenciais APNs diretas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis env de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas
autenticação do App Store Connect / TestFlight, como `ASC_KEY_ID` e `ASC_ISSUER_ID`; ele não configura
entrega APNs direta para builds iOS locais.

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

O app iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente de `local.`;
a descoberta entre redes pode usar o domínio de área ampla configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e DNS dividido do Tailscale.
Consulte [Bonjour](/pt-BR/gateway/bonjour) para o exemplo do CoreDNS.

### Host/porta manual

Em Ajustes, ative **Host Manual** e informe o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O Node iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host de canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido pelo servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).
- O Node iOS navega automaticamente para A2UI ao conectar quando uma URL de host de canvas é anunciada.
- Retorne ao scaffold integrado com `canvas.navigate` e `{"url":""}`.

## Relação com Computer Use

O app iOS é uma superfície móvel de Node, não um backend do Codex Computer Use. O Codex
Computer Use e `cua-driver mcp` controlam um desktop macOS local por meio de ferramentas MCP;
o app iOS expõe capacidades do iPhone por comandos de Node do OpenClaw
como `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Agentes ainda podem operar o app iOS por meio do OpenClaw invocando comandos de Node,
mas essas chamadas passam pelo protocolo de Node do gateway e seguem os limites de
primeiro plano/segundo plano do iOS. Use [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
para controle de desktop local e esta página para capacidades de Node iOS.

### Avaliação / snapshot do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo talk

- Ativação por voz e modo talk estão disponíveis em Ajustes.
- Nodes iOS compatíveis com talk anunciam a capacidade `talk` e podem declarar
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`;
  o Gateway permite esses comandos push-to-talk por padrão para Nodes confiáveis
  compatíveis com Talk.
- O iOS pode suspender áudio em segundo plano; trate recursos de voz como melhor esforço quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou uma URL de host de canvas; verifique `canvasHost` em [Configuração do Gateway](/pt-BR/gateway/configuration).
- Prompt de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- Reconexão falha após reinstalação: o token de pareamento do Keychain foi limpo; pareie o Node novamente.

## Documentos relacionados

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
