---
read_when:
    - Pareando ou reconectando o node iOS
    - Executando o app iOS a partir do código-fonte
    - Depurando a descoberta do gateway ou comandos de canvas
summary: 'App node do iOS: conectar ao Gateway, pareamento, canvas e solução de problemas'
title: app iOS
x-i18n:
    generated_at: "2026-04-25T13:50:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilidade: preview interno. O app iOS ainda não é distribuído publicamente.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe recursos de node: Canvas, snapshot de tela, captura de câmera, localização, modo Talk, Voice wake.
- Recebe comandos `node.invoke` e reporta eventos de status do node.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manuais (fallback).

## Início rápido (parear + conectar)

1. Inicie o Gateway:

```bash
openclaw gateway --port 18789
```

2. No app iOS, abra Settings e escolha um gateway descoberto (ou habilite Manual Host e informe host/porta).

3. Aprove a solicitação de pareamento no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o node iOS sempre se conectar a partir de uma sub-rede rigidamente controlada, você
pode optar pela aprovação automática no primeiro pareamento de node com CIDRs explícitos ou IPs exatos:

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

Isso vem desabilitado por padrão. Aplica-se apenas a pareamento novo de `role: node` sem
escopos solicitados. Pareamento de operador/navegador e qualquer alteração de função, escopo, metadados ou
chave pública ainda exigem aprovação manual.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push com relay para builds oficiais

Builds iOS oficiais distribuídos usam o relay de push externo em vez de publicar o token bruto do APNs
para o gateway.

Requisito do lado do gateway:

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

- O app iOS registra-se no relay usando App Attest e o recibo do app.
- O relay retorna um handle opaco do relay mais uma concessão de envio com escopo de registro.
- O app iOS busca a identidade do gateway pareado e a inclui no registro do relay, para que o registro com relay como backend seja delegado àquele gateway específico.
- O app encaminha esse registro com relay como backend ao gateway pareado com `push.apns.register`.
- O gateway usa esse handle do relay armazenado para `push.test`, ativações em segundo plano e ativações despertadas.
- A URL base do relay do gateway deve corresponder à URL do relay incorporada no build iOS oficial/TestFlight.
- Se o app depois se conectar a um gateway diferente ou a um build com uma URL base de relay diferente, ele atualizará o registro do relay em vez de reutilizar o vínculo antigo.

O que o gateway **não** precisa para esse caminho:

- Nenhum token de relay válido para toda a implantação.
- Nenhuma chave APNs direta para envios oficiais/TestFlight com relay como backend.

Fluxo esperado para o operador:

1. Instale o build iOS oficial/TestFlight.
2. Defina `gateway.push.apns.relay.baseUrl` no gateway.
3. Pareie o app com o gateway e deixe-o terminar a conexão.
4. O app publica `push.apns.register` automaticamente depois que tiver um token APNs, a sessão do operador estiver conectada e o registro no relay tiver sido bem-sucedido.
5. Depois disso, `push.test`, ativações de reconexão e ativações despertadas podem usar o registro armazenado com relay como backend.

Observação de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como substituição temporária por env para o gateway.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que APNs direto no gateway não pode fornecer para
builds iOS oficiais:

- Apenas builds iOS genuínos do OpenClaw distribuídos pela Apple podem usar o relay hospedado.
- Um gateway só pode enviar pushes com relay como backend para dispositivos iOS que parearam com aquele
  gateway específico.

Salto por salto:

1. `iOS app -> gateway`
   - O app primeiro pareia com o gateway pelo fluxo normal de autenticação do Gateway.
   - Isso dá ao app uma sessão de node autenticada mais uma sessão de operador autenticada.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `iOS app -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui prova de App Attest mais o recibo do app.
   - O relay valida o bundle ID, a prova de App Attest e o recibo da Apple, e exige o
     caminho de distribuição oficial/de produção.
   - É isso que impede builds locais/de desenvolvimento do Xcode de usarem o relay hospedado. Um build local pode estar
     assinado, mas não satisfaz a prova oficial de distribuição Apple que o relay espera.

3. `gateway identity delegation`
   - Antes do registro no relay, o app busca a identidade do gateway pareado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway no payload de registro do relay.
   - O relay retorna um handle do relay e uma concessão de envio com escopo de registro delegados àquela
     identidade de gateway.

4. `gateway -> relay`
   - O gateway armazena o handle do relay e a concessão de envio de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e ativações despertadas, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a concessão de envio armazenada quanto a assinatura do gateway em relação à identidade de
     gateway delegada no registro.
   - Outro gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o handle.

5. `relay -> APNs`
   - O relay controla as credenciais APNs de produção e o token APNs bruto para o build oficial.
   - O gateway nunca armazena o token APNs bruto para builds oficiais com relay como backend.
   - O relay envia o push final ao APNs em nome do gateway pareado.

Por que esse design foi criado:

- Para manter credenciais APNs de produção fora dos gateways dos usuários.
- Para evitar armazenar tokens APNs brutos de builds oficiais no gateway.
- Para permitir uso do relay hospedado apenas para builds OpenClaw oficiais/TestFlight.
- Para impedir que um gateway envie pushes de ativação despertada para dispositivos iOS pertencentes a um gateway diferente.

Builds locais/manuais permanecem em APNs direto. Se você estiver testando esses builds sem o relay, o
gateway ainda precisa de credenciais APNs diretas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de ambiente de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas
autenticação do App Store Connect / TestFlight como `ASC_KEY_ID` e `ASC_ISSUER_ID`; ele não configura
entrega APNs direta para builds iOS locais.

Armazenamento recomendado no host do gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Não faça commit do arquivo `.p8` nem o coloque no checkout do repositório.

## Caminhos de descoberta

### Bonjour (LAN)

O app iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente a partir de `local.`;
a descoberta entre redes pode usar o domínio de área ampla configurado sem mudar o tipo de beacon.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e split DNS do Tailscale.
Consulte [Bonjour](/pt-BR/gateway/bonjour) para ver o exemplo com CoreDNS.

### Host/porta manuais

Em Settings, habilite **Manual Host** e informe o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O node iOS renderiza um canvas em WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host de canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido pelo servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).
- O node iOS navega automaticamente para A2UI ao conectar quando uma URL de host de canvas é anunciada.
- Retorne ao scaffold embutido com `canvas.navigate` e `{"url":""}`.

### Avaliação / snapshot do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + modo Talk

- Voice wake e modo Talk estão disponíveis em Settings.
- O iOS pode suspender áudio em segundo plano; trate recursos de voz como best-effort quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou uma URL de host de canvas; verifique `canvasHost` em [Configuração do Gateway](/pt-BR/gateway/configuration).
- O prompt de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- A reconexão falha após reinstalação: o token de pareamento no Keychain foi limpo; pareie o node novamente.

## Documentação relacionada

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
