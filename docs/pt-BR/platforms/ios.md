---
read_when:
    - Emparelhamento ou reconexão do Node iOS
    - Executar o app iOS a partir do código-fonte
    - Depuração da descoberta do Gateway ou dos comandos de tela
summary: 'Aplicativo de nó para iOS: conectar-se ao Gateway, emparelhamento, tela e solução de problemas'
title: aplicativo iOS
x-i18n:
    generated_at: "2026-04-30T09:57:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidade: prévia interna. O app iOS ainda não é distribuído publicamente.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe capacidades de Node: Canvas, instantâneo de tela, captura da câmera, localização, modo de fala, ativação por voz.
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

2. No app iOS, abra Ajustes e escolha um gateway descoberto (ou habilite Host Manual e insira host/porta).

3. Aprove a solicitação de pareamento no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o Node iOS sempre se conectar a partir de uma sub-rede rigorosamente controlada, você
pode optar pela aprovação automática inicial de Node com CIDRs explícitos ou IPs exatos:

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

Isso fica desabilitado por padrão. Aplica-se apenas a pareamentos novos com `role: node`
sem escopos solicitados. Pareamento de operador/navegador e qualquer alteração de função, escopo,
metadados ou chave pública ainda exigem aprovação manual.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push com relay para builds oficiais

Builds iOS distribuídos oficialmente usam o relay de push externo em vez de publicar o token APNs bruto
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

- O app iOS se registra no relay usando App Attest e uma transação de app StoreKit em JWS.
- O relay retorna um identificador opaco do relay mais uma concessão de envio com escopo de registro.
- O app iOS busca a identidade do gateway pareado e a inclui no registro do relay, para que o registro apoiado pelo relay seja delegado a esse gateway específico.
- O app encaminha esse registro apoiado pelo relay ao gateway pareado com `push.apns.register`.
- O gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e nudges de ativação.
- A URL base do relay do gateway deve corresponder à URL do relay incorporada ao build iOS oficial/TestFlight.
- Se o app se conectar posteriormente a um gateway diferente ou a um build com uma URL base de relay diferente, ele atualiza o registro do relay em vez de reutilizar a vinculação antiga.

O que o gateway **não** precisa para este caminho:

- Nenhum token de relay para toda a implantação.
- Nenhuma chave APNs direta para envios oficiais/TestFlight apoiados pelo relay.

Fluxo esperado do operador:

1. Instale o build iOS oficial/TestFlight.
2. Defina `gateway.push.apns.relay.baseUrl` no gateway.
3. Pareie o app com o gateway e deixe-o concluir a conexão.
4. O app publica `push.apns.register` automaticamente depois que tiver um token APNs, a sessão do operador estiver conectada e o registro do relay tiver sucesso.
5. Depois disso, `push.test`, ativações de reconexão e nudges de ativação podem usar o registro armazenado apoiado pelo relay.

## Beacons de atividade em segundo plano

Quando o iOS acorda o app para um push silencioso, atualização em segundo plano ou evento de localização significativa, o app
tenta uma reconexão breve do Node e então chama `node.event` com `event: "node.presence.alive"`.
O gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do Node/dispositivo pareado somente
depois que a identidade autenticada do dispositivo Node é conhecida.

O app trata uma ativação em segundo plano como registrada com sucesso somente quando a resposta do gateway inclui
`handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é
compatível, mas não conta como uma atualização durável de último visto.

Nota de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como substituição temporária de env para o gateway.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que APNs direto no gateway não consegue fornecer para
builds iOS oficiais:

- Apenas builds iOS genuínos do OpenClaw distribuídos pela Apple podem usar o relay hospedado.
- Um gateway pode enviar pushes apoiados pelo relay somente para dispositivos iOS que foram pareados com esse gateway específico.

Trecho a trecho:

1. `iOS app -> gateway`
   - Primeiro, o app pareia com o gateway pelo fluxo normal de autenticação do Gateway.
   - Isso dá ao app uma sessão de Node autenticada mais uma sessão de operador autenticada.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `iOS app -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui prova de App Attest mais uma transação de app StoreKit em JWS.
   - O relay valida o ID do bundle, a prova de App Attest e a prova de distribuição da Apple, e exige o
     caminho de distribuição oficial/produção.
   - É isso que bloqueia builds locais do Xcode/desenvolvimento de usarem o relay hospedado. Um build local pode ser
     assinado, mas não satisfaz a prova de distribuição oficial da Apple que o relay espera.

3. `gateway identity delegation`
   - Antes do registro no relay, o app busca a identidade do gateway pareado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway no payload de registro do relay.
   - O relay retorna um identificador de relay e uma concessão de envio com escopo de registro delegados
     a essa identidade do gateway.

4. `gateway -> relay`
   - O gateway armazena o identificador de relay e a concessão de envio de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e nudges de ativação, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a concessão de envio armazenada quanto a assinatura do gateway em relação à identidade
     de gateway delegada no registro.
   - Outro gateway não consegue reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.

5. `relay -> APNs`
   - O relay possui as credenciais APNs de produção e o token APNs bruto do build oficial.
   - O gateway nunca armazena o token APNs bruto para builds oficiais apoiados pelo relay.
   - O relay envia o push final ao APNs em nome do gateway pareado.

Por que este design foi criado:

- Para manter credenciais APNs de produção fora dos gateways dos usuários.
- Para evitar armazenar tokens APNs brutos de builds oficiais no gateway.
- Para permitir o uso do relay hospedado apenas por builds OpenClaw oficiais/TestFlight.
- Para impedir que um gateway envie pushes de ativação para dispositivos iOS pertencentes a outro gateway.

Builds locais/manuais permanecem em APNs direto. Se você estiver testando esses builds sem o relay, o
gateway ainda precisa de credenciais APNs diretas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de ambiente de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas
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

Não faça commit do arquivo `.p8` nem o coloque dentro do checkout do repositório.

## Caminhos de descoberta

### Bonjour (LAN)

O app iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente a partir de `local.`;
a descoberta entre redes pode usar o domínio de área ampla configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e DNS dividido do Tailscale.
Consulte [Bonjour](/pt-BR/gateway/bonjour) para o exemplo de CoreDNS.

### Host/porta manual

Em Ajustes, habilite **Host Manual** e insira o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O Node iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- O host de canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido a partir do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
- O Node iOS navega automaticamente para A2UI ao conectar quando uma URL de host de canvas é anunciada.
- Retorne ao scaffold integrado com `canvas.navigate` e `{"url":""}`.

## Relação com Computer Use

O app iOS é uma superfície móvel de Node, não um backend do Codex Computer Use. Codex
Computer Use e `cua-driver mcp` controlam um desktop macOS local por meio de ferramentas MCP;
o app iOS expõe capacidades do iPhone por meio de comandos de Node do OpenClaw,
como `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Agentes ainda podem operar o app iOS por meio do OpenClaw invocando comandos de
Node, mas essas chamadas passam pelo protocolo de Node do gateway e seguem os
limites de primeiro plano/segundo plano do iOS. Use [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
para controle de desktop local e esta página para capacidades de Node iOS.

### Eval / snapshot do Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo de fala

- Ativação por voz e modo de fala estão disponíveis em Ajustes.
- O iOS pode suspender áudio em segundo plano; trate recursos de voz como melhor esforço quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou uma URL de host de canvas; verifique `canvasHost` na [configuração do Gateway](/pt-BR/gateway/configuration).
- O prompt de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- A reconexão falha após reinstalação: o token de pareamento do Keychain foi apagado; refaça o pareamento do Node.

## Documentação relacionada

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
