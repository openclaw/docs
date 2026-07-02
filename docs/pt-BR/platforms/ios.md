---
read_when:
    - Emparelhando ou reconectando o nó iOS
    - Executando o app iOS a partir do código-fonte
    - Depuração da descoberta do Gateway ou dos comandos de canvas
summary: 'app de nó iOS: conexão com o Gateway, pareamento, canvas e solução de problemas'
title: app para iOS
x-i18n:
    generated_at: "2026-07-02T08:01:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidade: builds do app para iPhone são distribuídos pelos canais da Apple quando habilitados para uma versão. Builds locais de desenvolvimento também podem ser executados a partir do código-fonte.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe capacidades de nó: Canvas, snapshot de tela, captura de câmera, localização, modo de fala, ativação por voz.
- Recebe comandos `node.invoke` e relata eventos de status do nó.

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

2. No app iOS, abra Configurações e escolha um gateway descoberto (ou habilite Host manual e informe host/porta).

3. Aprove a solicitação de pareamento no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o nó iOS sempre se conecta a partir de uma sub-rede rigidamente controlada, você
pode optar pela aprovação automática de nó na primeira vez com CIDRs explícitos ou IPs exatos:

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

Isso é desabilitado por padrão. Aplica-se apenas a pareamentos novos com `role: node` e
sem escopos solicitados. Pareamento de operador/navegador e qualquer alteração de função, escopo, metadados ou
chave pública ainda exigem aprovação manual.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push apoiado por relay para builds oficiais

Builds iOS oficiais distribuídos usam o relay de push externo em vez de publicar o token APNs bruto
para o gateway.

Builds oficiais da App Store da linha de release pública usam o relay hospedado em `https://ios-push-relay.openclaw.ai`.

Implantações de relay customizadas exigem um caminho deliberadamente separado de build/implantação iOS cujo URL de relay corresponda ao URL de relay do gateway. A linha de release pública da App Store não aceita sobrescritas de URL de relay customizado. Se você estiver usando um build de relay customizado, defina o URL de relay correspondente do gateway:

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

- O app iOS se registra no relay usando App Attest e um JWS de transação do app do StoreKit.
- O relay retorna um identificador opaco de relay mais uma concessão de envio com escopo de registro.
- O app iOS busca a identidade do gateway pareado e a inclui no registro do relay, portanto o registro apoiado por relay é delegado a esse gateway específico.
- O app encaminha esse registro apoiado por relay ao gateway pareado com `push.apns.register`.
- O gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e nudges de ativação.
- URLs de relay de gateway customizados devem corresponder ao URL de relay embutido no build iOS.
- Se o app posteriormente se conectar a um gateway diferente ou a um build com um URL base de relay diferente, ele atualiza o registro do relay em vez de reutilizar o vínculo antigo.

O que o gateway **não** precisa para este caminho:

- Nenhum token de relay em toda a implantação.
- Nenhuma chave APNs direta para envios oficiais apoiados por relay da App Store.

Fluxo esperado do operador:

1. Instale o app iOS oficial.
2. Opcional: defina `gateway.push.apns.relay.baseUrl` no gateway somente ao usar um build de relay customizado deliberadamente separado.
3. Pareie o app com o gateway e deixe-o terminar de conectar.
4. O app publica `push.apns.register` automaticamente depois de ter um token APNs, a sessão de operador estar conectada e o registro de relay ser bem-sucedido.
5. Depois disso, `push.test`, ativações de reconexão e nudges de ativação podem usar o registro armazenado apoiado por relay.

## Beacons de atividade em segundo plano

Quando o iOS ativa o app para um push silencioso, atualização em segundo plano ou evento de localização significativa, o app
tenta uma breve reconexão de nó e então chama `node.event` com `event: "node.presence.alive"`.
O gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do nó/dispositivo pareado somente
depois que a identidade autenticada do dispositivo de nó é conhecida.

O app trata uma ativação em segundo plano como registrada com sucesso somente quando a resposta do gateway inclui
`handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é
compatível, mas não conta como uma atualização durável de último visto.

Observação de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como uma sobrescrita temporária de env para o gateway.
- A linha de release pública da App Store rejeita `OPENCLAW_PUSH_RELAY_BASE_URL` para builds iOS.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que APNs direto no gateway não consegue fornecer para
builds iOS oficiais:

- Somente builds iOS genuínos do OpenClaw distribuídos pela Apple podem usar o relay hospedado.
- Um gateway pode enviar pushes apoiados por relay somente para dispositivos iOS pareados com esse
  gateway específico.

Salto a salto:

1. `app iOS -> gateway`
   - O app primeiro pareia com o gateway pelo fluxo normal de autenticação do Gateway.
   - Isso dá ao app uma sessão de nó autenticada mais uma sessão de operador autenticada.
   - A sessão de operador é usada para chamar `gateway.identity.get`.

2. `app iOS -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui prova do App Attest mais um JWS de transação do app do StoreKit.
   - O relay valida o ID do bundle, a prova do App Attest e a prova de distribuição da Apple, e exige o
     caminho de distribuição oficial/produção.
   - É isso que bloqueia builds locais de Xcode/dev de usar o relay hospedado. Um build local pode ser
     assinado, mas não satisfaz a prova de distribuição oficial da Apple que o relay espera.

3. `delegação de identidade do gateway`
   - Antes do registro do relay, o app busca a identidade do gateway pareado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway no payload de registro do relay.
   - O relay retorna um identificador de relay e uma concessão de envio com escopo de registro delegados a
     essa identidade do gateway.

4. `gateway -> relay`
   - O gateway armazena o identificador de relay e a concessão de envio de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e nudges de ativação, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a concessão de envio armazenada quanto a assinatura do gateway contra a identidade de
     gateway delegada do registro.
   - Outro gateway não consegue reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.

5. `relay -> APNs`
   - O relay possui as credenciais APNs de produção e o token APNs bruto para o build oficial.
   - O gateway nunca armazena o token APNs bruto para builds oficiais apoiados por relay.
   - O relay envia o push final para APNs em nome do gateway pareado.

Por que este design foi criado:

- Para manter credenciais APNs de produção fora dos gateways dos usuários.
- Para evitar armazenar tokens APNs brutos de builds oficiais no gateway.
- Para permitir o uso do relay hospedado somente por builds iOS oficiais do OpenClaw.
- Para impedir que um gateway envie pushes de ativação para dispositivos iOS pertencentes a um gateway diferente.

Builds locais/manuais permanecem em APNs direto. Se você estiver testando esses builds sem o relay, o
gateway ainda precisa de credenciais APNs diretas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas são variáveis de env de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas
autenticação do App Store Connect, como `APP_STORE_CONNECT_KEY_ID` e
`APP_STORE_CONNECT_ISSUER_ID`; ele não configura entrega direta de APNs para builds iOS locais.

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

O app iOS navega por `_openclaw-gw._tcp` em `local.` e, quando configurado, pelo mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente a partir de `local.`;
descoberta entre redes pode usar o domínio de área ampla configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e DNS dividido do Tailscale.
Veja [Bonjour](/pt-BR/gateway/bonjour) para o exemplo de CoreDNS.

### Host/porta manual

Em Configurações, habilite **Host manual** e informe o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O nó iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host de Canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido pelo servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
- O nó iOS mantém o scaffold integrado como a visualização padrão conectada. `canvas.a2ui.push` e `canvas.a2ui.reset` usam a página A2UI agrupada pertencente ao app.
- Páginas A2UI remotas do Gateway são somente renderização no iOS; ações de botão A2UI nativas são aceitas somente de páginas agrupadas pertencentes ao app.
- Retorne ao scaffold integrado com `canvas.navigate` e `{"url":""}`.

## Relação com Computer Use

O app iOS é uma superfície de nó móvel, não um backend de Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controlam um desktop macOS local por ferramentas MCP;
o app iOS expõe capacidades do iPhone por comandos de nó do OpenClaw
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

## Ativação por voz + modo de fala

- Ativação por voz e modo de fala estão disponíveis em Configurações.
- Nós iOS com suporte a fala anunciam a capacidade `talk` e podem declarar
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`;
  o Gateway permite esses comandos push-to-talk por padrão para nós confiáveis
  com suporte a fala.
- O iOS pode suspender áudio em segundo plano; trate recursos de voz como melhor esforço quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_UNAVAILABLE`: a página A2UI agrupada não estava acessível no WebView do app; mantenha o app em primeiro plano na aba Tela e tente novamente.
- O prompt de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- A reconexão falha após reinstalar: o token de pareamento do Keychain foi limpo; pareie o nó novamente.

## Documentos relacionados

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
