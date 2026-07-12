---
doc-schema-version: 1
read_when:
    - Você quer criar um novo plugin do OpenClaw
    - Você precisa de um guia de início rápido para o desenvolvimento de plugins
    - Você está escolhendo entre a documentação de canal, provedor, backend de CLI, ferramenta ou hook
sidebarTitle: Getting Started
summary: Crie seu primeiro plugin do OpenClaw em minutos
title: Criando plugins
x-i18n:
    generated_at: "2026-07-12T00:08:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins estendem o OpenClaw sem alterar o núcleo. Um plugin pode adicionar um
canal de mensagens, provedor de modelos, backend de CLI local, ferramenta de agente, hook, provedor de mídia
ou outro recurso pertencente ao plugin.

Você não precisa adicionar um plugin externo ao repositório do OpenClaw. Publique
o pacote no [ClawHub](/clawhub), e os usuários poderão instalá-lo com:

```bash
openclaw plugins install clawhub:<package-name>
```

Especificações de pacote sem prefixo ainda são instaladas pelo npm durante a transição de lançamento. Use o
prefixo `clawhub:` quando quiser a resolução pelo ClawHub.

## Requisitos

- Node 22.19+, Node 23.11+ ou Node 24+, e `npm` ou `pnpm`.
- Módulos ESM do TypeScript.
- Para trabalhar em um plugin incluído no repositório, clone o repositório e execute `pnpm install`.
  O desenvolvimento de plugins a partir do checkout do código-fonte usa somente pnpm, pois o OpenClaw descobre
  plugins incluídos nos pacotes do workspace `extensions/*`.

## Escolha o formato do plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens.
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelos, mídia, pesquisa, busca, fala ou comunicação em tempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Execute uma CLI local de IA por meio do fallback de modelos do OpenClaw.
  </Card>
  <Card title="Plugin de ferramenta" icon="wrench" href="/pt-BR/plugins/tool-plugins">
    Registre ferramentas de agente.
  </Card>
</CardGroup>

## Início rápido

Crie um plugin de ferramenta mínimo registrando uma ferramenta de agente obrigatória. Esse é o
formato útil mais simples de plugin e abrange o pacote, o manifesto, o ponto de entrada e a
validação local.

<Steps>
  <Step title="Criar os metadados do pacote">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Plugins externos publicados devem direcionar as entradas de runtime para arquivos JavaScript
    compilados. Consulte [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) para conhecer o contrato completo
    dos pontos de entrada.

    Todo plugin precisa de um manifesto, mesmo que não tenha configuração. As ferramentas de runtime devem
    constar em `contracts.tools` para que o OpenClaw possa descobrir a propriedade sem
    carregar antecipadamente o runtime de todos os plugins. Defina `activation.onStartup`
    deliberadamente; este exemplo é carregado na inicialização do Gateway.

    As superfícies de plugin confiáveis pelo host também são controladas pelo manifesto e exigem uma
    declaração explícita para plugins instalados: `api.registerAgentToolResultMiddleware(...)`
    exige que cada runtime de destino seja listado em `contracts.agentToolResultMiddleware`,
    e `api.registerTrustedToolPolicy(...)` exige cada id de política em
    `contracts.trustedToolPolicies`. Essas declarações mantêm alinhadas a
    inspeção durante a instalação e o registro no runtime.

    Para todos os campos do manifesto, consulte [Manifesto do plugin](/pt-BR/plugins/manifest).

  </Step>

  <Step title="Registrar a ferramenta">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Use `definePluginEntry` para plugins que não sejam de canal. Em vez disso, plugins de canal usam
    `defineChannelPluginEntry` de `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Testar o runtime">
    Para um plugin instalado ou externo, inspecione o runtime carregado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se o plugin registrar um comando de CLI, execute também esse comando e confirme
    a saída, por exemplo, `openclaw demo-plugin ping`.

    Para um plugin incluído neste repositório, o OpenClaw descobre os pacotes de plugin
    do checkout do código-fonte no workspace `extensions/*`. Execute o teste direcionado
    mais próximo:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Testar a instalação do pacote">
    Antes de publicar um plugin pronto para empacotamento, teste o mesmo formato de instalação que os usuários
    receberão. Primeiro, adicione uma etapa de compilação, direcione entradas de runtime como
    `openclaw.extensions` para JavaScript compilado, como `./dist/index.js`, e
    garanta que `npm pack` inclua essa saída `dist/`. Entradas de código-fonte TypeScript são
    apenas para checkouts do código-fonte e caminhos de desenvolvimento local.

    Em seguida, empacote o plugin e instale o tarball com `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa o projeto npm por plugin gerenciado pelo OpenClaw e, assim, detecta
    erros de dependência do runtime que os testes em checkout do código-fonte podem ocultar. Ele valida
    o formato do pacote e das dependências, não a confiança oficial vinculada ao catálogo.
    As importações de runtime devem estar em `dependencies` ou `optionalDependencies`;
    dependências deixadas apenas em `devDependencies` não serão instaladas no
    projeto de runtime gerenciado.

    Não use uma instalação bruta de arquivo/caminho como validação final do comportamento oficial ou
    privilegiado do plugin. Códigos-fonte brutos são úteis para depuração local, mas
    não validam o mesmo caminho de dependências das instalações pelo npm ou ClawHub. Se
    o plugin depender do status confiável de plugin oficial, adicione uma segunda validação
    por meio de uma instalação oficial baseada em catálogo ou de um caminho de pacote publicado que
    registre a confiança oficial. Consulte
    [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution) para obter
    detalhes sobre a raiz da instalação e a propriedade das dependências.

  </Step>

  <Step title="Publicar">
    Valide o pacote antes de publicá-lo:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Os trechos canônicos de pacotes do ClawHub ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instalar">
    Instale o pacote publicado pelo ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registro de ferramentas

As ferramentas podem ser obrigatórias ou opcionais. As ferramentas obrigatórias estão sempre disponíveis quando o
plugin está habilitado. As ferramentas opcionais exigem consentimento explícito do usuário antes que o OpenClaw
carregue o runtime do plugin proprietário.

As fábricas de ferramentas recebem um contexto de runtime confiável, incluindo `deliveryContext`,
`nativeChannelId` para a conversa ativa da plataforma, quando disponível, e
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Toda ferramenta registrada com `api.registerTool(...)` também deve ser declarada no
manifesto do plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Os usuários dão consentimento com `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

As ferramentas opcionais controlam se uma ferramenta é exposta ao modelo. Use
[solicitações de permissão de plugins](/pt-BR/plugins/plugin-permission-requests) quando uma ferramenta
ou hook precisar solicitar aprovação depois que o modelo a selecionar e antes que a
ação seja executada.

Use ferramentas opcionais para efeitos colaterais, binários incomuns ou recursos que
não devem ser expostos por padrão. Os nomes das ferramentas não podem entrar em conflito com os nomes das ferramentas
do núcleo; os conflitos são ignorados e relatados nos diagnósticos do plugin. Registros
malformados são ignorados e relatados da mesma forma: ausência de um
`name` não vazio, um `execute` que não seja uma função ou um descritor de ferramenta sem um objeto
`parameters`.

As fábricas de ferramentas recebem um objeto de contexto fornecido pelo runtime. Use `ctx.activeModel`
quando uma ferramenta precisar registrar, exibir ou se adaptar ao modelo ativo do turno
atual; ele pode incluir `provider`, `modelId` e `modelRef`. Trate-o como
metadados informativos do runtime, não como uma barreira de segurança contra o operador
local, o código de plugins instalados ou um runtime modificado do OpenClaw. Ferramentas
locais confidenciais ainda devem exigir consentimento explícito do plugin ou do operador e
falhar de forma fechada quando os metadados do modelo ativo estiverem ausentes ou forem inadequados.

O manifesto declara a propriedade e a descoberta; a execução ainda chama a implementação
registrada ativa da ferramenta. Mantenha `toolMetadata.<tool>.optional: true`
alinhado com `api.registerTool(..., { optional: true })` para que o OpenClaw possa evitar
carregar o runtime desse plugin até que a ferramenta seja explicitamente incluída na lista de permissões.

## Convenções de importação

Importe de subcaminhos específicos do SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Não importe do barrel raiz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

No pacote do plugin, use arquivos barrel locais, como `api.ts` e
`runtime-api.ts`, para importações internas. Não importe seu próprio plugin por meio de um
caminho do SDK. Auxiliares específicos de um provedor devem permanecer no pacote do provedor, a menos que
a interface seja realmente genérica.

Métodos RPC personalizados do Gateway são um ponto de entrada avançado. Mantenha-os em um
prefixo específico do plugin; namespaces administrativos do núcleo, como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*`, permanecem reservados
e são resolvidos para `operator.admin`. A ponte
`openclaw/plugin-sdk/gateway-method-runtime` é reservada para rotas HTTP de plugins
que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para consultar o mapa completo de importações, veja [Visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview).

## Lista de verificação antes do envio

<Check>**package.json** contém os metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos específicos `plugin-sdk/<subpath>`</Check>
<Check>As importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Os testes passam (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins do repositório)</Check>

## Teste com versões beta

1. Acompanhe os lançamentos de [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). As tags beta têm o formato `v2026.3.N-beta.1`. Você também pode seguir [@openclaw](https://x.com/openclaw) no X para receber anúncios de lançamentos.
2. Teste seu plugin com a tag beta assim que ela aparecer. O intervalo antes da versão estável costuma ser de apenas algumas horas.
3. Após o teste, publique no tópico do seu plugin no canal `plugin-forum` do Discord ([discord.gg/clawd](https://discord.gg/clawd)), informando `all good` ou descrevendo o que apresentou falha. Crie um tópico caso ainda não tenha um.
4. Se algo apresentar falha, abra ou atualize uma issue com o título `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Inclua o link da issue no seu tópico.
5. Abra um PR para `main` com o título `fix(<plugin-id>): beta blocker - <summary>` e inclua o link da issue tanto no PR quanto no seu tópico do Discord. Colaboradores não podem aplicar rótulos a PRs, portanto o título é o sinal do PR para os mantenedores e a automação. Bloqueadores com um PR são mesclados; bloqueadores sem um PR podem acabar sendo lançados mesmo assim.
6. O silêncio significa que está tudo certo. Perder esse intervalo normalmente significa que sua correção será incluída no próximo ciclo.

## Próximas etapas

<CardGroup cols={2}>
  <Card title="Plugins de canais" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens
  </Card>
  <Card title="Plugins de provedores" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelos
  </Card>
  <Card title="Plugins de backend da CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Registre um backend local de CLI de IA
  </Card>
  <Card title="Visão geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro
  </Card>
  <Card title="Utilitários de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, pesquisa e subagente via api.runtime
  </Card>
  <Card title="Testes" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifesto do Plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do esquema do manifesto
  </Card>
</CardGroup>

## Relacionado

- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Arquitetura de Plugin](/pt-BR/plugins/architecture)
