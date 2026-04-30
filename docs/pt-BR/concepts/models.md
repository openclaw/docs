---
read_when:
    - Adicionar ou modificar a CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Alterar o comportamento de fallback do modelo ou a UX de seleção
    - Atualizando sondas de varredura de modelos (ferramentas/imagens)
sidebarTitle: Models CLI
summary: 'CLI de modelos: list, set, aliases, fallbacks, scan, status'
title: CLI de Modelos
x-i18n:
    generated_at: "2026-04-30T09:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Alternância de modelo em caso de falha" href="/pt-BR/concepts/model-failover">
    Rotação de perfil de autenticação, tempos de espera e como isso interage com alternativas.
  </Card>
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers">
    Visão geral rápida de provedores e exemplos.
  </Card>
  <Card title="Runtimes de agente" href="/pt-BR/concepts/agent-runtimes">
    PI, Codex e outros runtimes de loop de agente.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults">
    Chaves de configuração de modelo.
  </Card>
</CardGroup>

Referências de modelo escolhem um provedor e um modelo. Elas normalmente não escolhem o runtime de agente de baixo nível. Por exemplo, `openai/gpt-5.5` pode ser executado pelo caminho normal do provedor OpenAI ou pelo runtime de servidor de aplicativo do Codex, dependendo de `agents.defaults.agentRuntime.id`. Consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

## Como a seleção de modelo funciona

OpenClaw seleciona modelos nesta ordem:

<Steps>
  <Step title="Modelo principal">
    `agents.defaults.model.primary` (ou `agents.defaults.model`).
  </Step>
  <Step title="Alternativas">
    `agents.defaults.model.fallbacks` (em ordem).
  </Step>
  <Step title="Alternância de autenticação do provedor em caso de falha">
    A alternância de autenticação em caso de falha acontece dentro de um provedor antes de passar para o próximo modelo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superfícies de modelo relacionadas">
    - `agents.defaults.models` é a lista de permissões/catálogo de modelos que o OpenClaw pode usar (mais aliases).
    - `agents.defaults.imageModel` é usado **somente quando** o modelo principal não consegue aceitar imagens.
    - `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta recorre a `agents.defaults.imageModel` e depois ao modelo resolvido da sessão/padrão.
    - `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagens. Se omitido, `image_generate` ainda pode inferir um padrão de provedor apoiado por autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de imagens em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provedor apoiado por autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de música em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provedor apoiado por autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de vídeo em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - Padrões por agente podem substituir `agents.defaults.model` via `agents.list[].model` mais vínculos (consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origem da seleção e comportamento de alternativa

O mesmo `provider/model` pode significar coisas diferentes dependendo de sua origem:

- Padrões configurados (`agents.defaults.model.primary` e modelos principais específicos de agente) são o ponto de partida normal e usam `agents.defaults.model.fallbacks`.
- Seleções automáticas de alternativa são estado temporário de recuperação. Elas são armazenadas com `modelOverrideSource: "auto"` para que turnos posteriores possam continuar usando a cadeia de alternativas sem testar primeiro um modelo principal sabidamente problemático.
- Seleções de sessão do usuário são exatas. `/model`, o seletor de modelo, `session_status(model=...)` e `sessions.patch` armazenam `modelOverrideSource: "user"`; se esse provedor/modelo selecionado estiver inacessível, o OpenClaw falha de forma visível em vez de passar para outro modelo configurado.
- Cron `--model` / carga útil `model` é um modelo principal por tarefa. Ele ainda usa alternativas configuradas, a menos que a tarefa forneça `fallbacks` explícitos na carga útil (use `fallbacks: []` para uma execução cron estrita).
- Seletores de modelo padrão e lista de permissões da CLI respeitam `models.mode: "replace"` listando `models.providers.*.models` explícitos em vez de carregar o catálogo integrado completo.
- O seletor de modelo da interface de controle pede ao Gateway sua visualização de modelo configurada: `agents.defaults.models` quando presente; caso contrário, `models.providers.*.models` explícitos mais provedores com autenticação utilizável. O catálogo integrado completo fica reservado para visualizações explícitas de navegação, como `models.list` com `view: "all"` ou `openclaw models list --all`.

## Política rápida de modelos

- Defina seu modelo principal como o modelo de geração mais recente e mais forte disponível para você.
- Use alternativas para tarefas sensíveis a custo/latência e conversas de menor risco.
- Para agentes com ferramentas habilitadas ou entradas não confiáveis, evite camadas de modelo mais antigas/mais fracas.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para provedores comuns, incluindo **assinatura do OpenAI Code (Codex)** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permissões + aliases + parâmetros de provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

<Note>
Referências de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) ficam em [OpenCode](/pt-BR/providers/opencode).
</Note>

### Edições seguras da lista de permissões

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regras de proteção contra sobrescrita">
    `openclaw config set` protege mapas de modelo/provedor contra sobrescritas acidentais. Uma atribuição de objeto simples a `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` é rejeitada quando removeria entradas existentes. Use `--merge` para alterações aditivas; use `--replace` somente quando o valor fornecido deve se tornar o valor-alvo completo.

    A configuração interativa de provedor e `openclaw configure --section model` também mesclam seleções com escopo de provedor à lista de permissões existente, portanto adicionar Codex, Ollama ou outro provedor não remove entradas de modelo não relacionadas. A configuração preserva um `agents.defaults.model.primary` existente quando a autenticação do provedor é reaplicada. Comandos explícitos de definição de padrão, como `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>`, ainda substituem `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Modelo não permitido" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **lista de permissões** para `/model` e para substituições de sessão. Quando um usuário seleciona um modelo que não está nessa lista de permissões, o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode dar a impressão de que ele "não respondeu". A correção é uma destas opções:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a lista de permissões (remover `agents.defaults.models`), ou
- Escolher um modelo em `/model list`.

</Warning>

Para modelos locais/GGUF, armazene a referência completa prefixada pelo provedor na lista de permissões,
por exemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` ou o
provedor/modelo exato mostrado por `openclaw models list --provider <provider>`.
Nomes de arquivos locais sem prefixo ou nomes de exibição não são suficientes quando a lista de permissões está
ativa.

Exemplo de configuração de lista de permissões:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Trocar modelos no chat (`/model`)

Você pode trocar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Comportamento do seletor">
    - `/model` (e `/model list`) é um seletor compacto, numerado (família de modelo + provedores disponíveis).
    - No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa de envio.
    - `/models add` foi descontinuado e agora retorna uma mensagem de descontinuação em vez de registrar modelos pelo chat.
    - `/model <#>` seleciona a partir desse seletor.

  </Accordion>
  <Accordion title="Persistência e troca ao vivo">
    - `/model` persiste a nova seleção da sessão imediatamente.
    - Se o agente estiver ocioso, a próxima execução usa o novo modelo imediatamente.
    - Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia com o novo modelo em um ponto limpo de nova tentativa.
    - Se atividade de ferramenta ou saída de resposta já tiver começado, a troca pendente pode permanecer enfileirada até uma oportunidade posterior de nova tentativa ou até o próximo turno do usuário.
    - Uma referência `/model` selecionada pelo usuário é estrita para essa sessão: se o provedor/modelo selecionado estiver inacessível, a resposta falha de forma visível em vez de responder silenciosamente a partir de `agents.defaults.model.fallbacks`. Isso é diferente de padrões configurados e modelos principais de tarefas cron, que ainda podem usar cadeias de alternativas.
    - `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, `baseUrl` de endpoint do provedor + modo `api`).

  </Accordion>
  <Accordion title="Análise de referência">
    - Referências de modelo são analisadas dividindo no **primeiro** `/`. Use `provider/model` ao digitar `/model <ref>`.
    - Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
      1. correspondência de alias
      2. correspondência única de provedor configurado para esse ID de modelo exato sem prefixo
      3. alternativa descontinuada para o provedor padrão configurado — se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado para evitar expor um padrão obsoleto de provedor removido.
  </Accordion>
</AccordionGroup>

Comportamento/configuração completa de comandos: [Comandos de barra](/pt-BR/tools/slash-commands).

## Comandos da CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sem subcomando) é um atalho para `models status`.

### `models list`

Mostra modelos configurados/disponíveis por autenticação por padrão. Flags úteis:

<ParamField path="--all" type="boolean">
  Catálogo completo. Inclui linhas de catálogo estático integradas pertencentes ao provedor antes de a autenticação ser configurada, para que visualizações somente de descoberta possam mostrar modelos indisponíveis até você adicionar credenciais correspondentes do provedor.
</ParamField>
<ParamField path="--local" type="boolean">
  Somente provedores locais.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtrar por ID de provedor, por exemplo `moonshot`. Rótulos de exibição de seletores interativos não são aceitos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Um modelo por linha.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída legível por máquina.
</ParamField>

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação dos provedores configurados. Também exibe o status de expiração OAuth para perfis encontrados no armazenamento de autenticação (alerta dentro de 24h por padrão). `--plain` imprime apenas o modelo primário resolvido.

<AccordionGroup>
  <Accordion title="Autenticação e comportamento de sondagem">
    - O status OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado não tiver credenciais, `models status` imprime uma seção **Autenticação ausente**.
    - O JSON inclui `auth.oauth` (janela de alerta + perfis) e `auth.providers` (autenticação efetiva por provedor, incluindo credenciais baseadas em env). `auth.oauth` é apenas a integridade dos perfis do armazenamento de autenticação; provedores somente por env não aparecem ali.
    - Use `--check` para automação (sai com `1` quando estiver ausente/expirado, `2` quando estiver expirando).
    - Use `--probe` para verificações de autenticação em tempo real; linhas de sondagem podem vir de perfis de autenticação, credenciais env ou `models.json`.
    - Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata `excluded_by_auth_order` em vez de tentar usá-lo. Se a autenticação existir, mas nenhum modelo sondável puder ser resolvido para esse provedor, a sondagem relata `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
A escolha de autenticação depende do provedor/conta. Para hosts de Gateway sempre ativos, chaves de API costumam ser as mais previsíveis; a reutilização da Claude CLI e perfis OAuth/token existentes da Anthropic também são compatíveis.
</Note>

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Varredura (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode, opcionalmente, sondar modelos para suporte a ferramentas e imagens.

<ParamField path="--no-probe" type="boolean">
  Pular sondagens em tempo real (somente metadados).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Tamanho mínimo de parâmetros (bilhões).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Pular modelos mais antigos.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro de prefixo de provedor.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Tamanho da lista de fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Define `agents.defaults.model.primary` para a primeira seleção.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Define `agents.defaults.imageModel.primary` para a primeira seleção de imagem.
</ParamField>

<Note>
O catálogo `/models` do OpenRouter é público, portanto varreduras somente de metadados podem listar candidatos gratuitos sem uma chave. Sondagem e inferência ainda exigem uma chave de API do OpenRouter (de perfis de autenticação ou `OPENROUTER_API_KEY`). Se nenhuma chave estiver disponível, `openclaw models scan` recorre à saída somente de metadados e deixa a configuração inalterada. Use `--no-probe` para solicitar explicitamente o modo somente de metadados.
</Note>

Os resultados da varredura são classificados por:

1. Suporte a imagens
2. Latência de ferramentas
3. Tamanho do contexto
4. Contagem de parâmetros

Entrada:

- Lista `/models` do OpenRouter (filtro `:free`)
- Sondagens em tempo real exigem uma chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (consulte [Variáveis de ambiente](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitação/sondagem: `--timeout`, `--concurrency`

Quando sondagens em tempo real são executadas em um TTY, você pode selecionar fallbacks interativamente. No modo não interativo, passe `--yes` para aceitar os padrões. Resultados somente de metadados são informativos; `--set-default` e `--set-image` exigem sondagens em tempo real para que o OpenClaw não configure um modelo OpenRouter sem chave inutilizável.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` no diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo é mesclado por padrão, a menos que `models.mode` seja definido como `replace`.

<AccordionGroup>
  <Accordion title="Precedência do modo de mesclagem">
    Precedência do modo de mesclagem para IDs de provedor correspondentes:

    - `baseUrl` não vazio já presente no `models.json` do agente vence.
    - `apiKey` não vazio no `models.json` do agente vence somente quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
    - Valores de `apiKey` de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs env, `secretref-managed` para refs file/exec), em vez de persistir segredos resolvidos.
    - Valores de cabeçalho de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs env, `secretref-managed` para refs file/exec).
    - `apiKey`/`baseUrl` vazios ou ausentes do agente recorrem a `models.providers` da configuração.
    - Outros campos de provedor são atualizados a partir da configuração e dos dados normalizados do catálogo.

  </Accordion>
</AccordionGroup>

<Note>
A persistência de marcadores é autoritativa pela origem: o OpenClaw grava marcadores a partir do snapshot da configuração de origem ativa (pré-resolução), não de valores secretos resolvidos em tempo de execução. Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comandos como `openclaw agent`.
</Note>

## Relacionados

- [Runtimes de agente](/pt-BR/concepts/agent-runtimes) — PI, Codex e outros runtimes de loop de agente
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo
- [Geração de imagem](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Provedores de modelo](/pt-BR/concepts/model-providers) — roteamento de provedores e autenticação
- [Geração de música](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração de modelo de vídeo
