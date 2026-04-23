---
read_when:
    - Adicionando ou modificando a CLI de modelos (`models list/set/scan/aliases/fallbacks`)
    - Alterando o comportamento de fallback de modelo ou a UX de seleção
    - Atualizando as sondagens de verificação de modelo (ferramentas/imagens)
summary: 'CLI de modelos: listar, definir, aliases, fallbacks, verificar, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-23T14:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# CLI de Modelos

Consulte [/concepts/model-failover](/pt-BR/concepts/model-failover) para rotação de
perfis de autenticação, cooldowns e como isso interage com fallbacks.
Visão geral rápida de providers + exemplos: [/concepts/model-providers](/pt-BR/concepts/model-providers).

## Como a seleção de modelo funciona

O OpenClaw seleciona modelos nesta ordem:

1. **Primário** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (na ordem).
3. **Failover de autenticação do provider** acontece dentro de um provider antes de passar para o
   próximo modelo.

Relacionado:

- `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenClaw pode usar (mais aliases).
- `agents.defaults.imageModel` é usado **apenas quando** o modelo primário não aceita imagens.
- `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta
  recorre a `agents.defaults.imageModel`, depois ao modelo resolvido da sessão/padrão.
- `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagem. Se omitido, `image_generate` ainda pode inferir um padrão de provider com autenticação. Ele tenta primeiro o provider padrão atual e depois os demais providers de geração de imagem registrados em ordem de ID do provider. Se você definir um provider/modelo específico, também configure a autenticação/chave de API desse provider.
- `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provider com autenticação. Ele tenta primeiro o provider padrão atual e depois os demais providers de geração de música registrados em ordem de ID do provider. Se você definir um provider/modelo específico, também configure a autenticação/chave de API desse provider.
- `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provider com autenticação. Ele tenta primeiro o provider padrão atual e depois os demais providers de geração de vídeo registrados em ordem de ID do provider. Se você definir um provider/modelo específico, também configure a autenticação/chave de API desse provider.
- Padrões por agente podem substituir `agents.defaults.model` por meio de `agents.list[].model` mais bindings (consulte [/concepts/multi-agent](/pt-BR/concepts/multi-agent)).

## Política rápida de modelos

- Defina o primário como o modelo mais forte e de última geração disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e conversas de menor criticidade.
- Para agentes com ferramentas ativadas ou entradas não confiáveis, evite camadas de modelo mais antigas/mais fracas.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para providers comuns, incluindo **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros de provider)
- `models.providers` (providers personalizados gravados em `models.json`)

Referências de modelo são normalizadas para minúsculas. Aliases de provider como `z.ai/*` são normalizados
para `zai/*`.

Exemplos de configuração de provider (incluindo OpenCode) estão em
[/providers/opencode](/pt-BR/providers/opencode).

### Edições seguras da allowlist

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protege mapas de modelo/provider contra sobrescritas acidentais. Uma
atribuição simples de objeto a `agents.defaults.models`, `models.providers` ou
`models.providers.<id>.models` é rejeitada quando removeria entradas
existentes. Use `--merge` para alterações aditivas; use `--replace` apenas quando o
valor fornecido deve se tornar o valor-alvo completo.

A configuração interativa de provider e `openclaw configure --section model` também mesclam
seleções com escopo de provider à allowlist existente, então adicionar Codex,
Ollama ou outro provider não remove entradas de modelos não relacionados.

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para
substituições de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist,
o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode dar a impressão
de que “não respondeu”. A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um modelo em `/model list`.

Exemplo de configuração de allowlist:

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

## Trocando modelos no chat (`/model`)

Você pode trocar modelos da sessão atual sem reiniciar:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Observações:

- `/model` (e `/model list`) é um seletor compacto e numerado (família de modelo + providers disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com listas suspensas de provider e modelo, além de uma etapa de envio.
- `/models add` está disponível por padrão e pode ser desativado com `commands.modelsWrite=false`.
- Quando ativado, `/models add <provider> <modelId>` é o caminho mais rápido; `/models add` sem argumentos inicia um fluxo guiado com provider primeiro, quando compatível.
- Após `/models add`, o novo modelo fica disponível em `/models` e `/model` sem reiniciar o gateway.
- `/model <#>` seleciona a partir desse seletor.
- `/model` persiste a nova seleção da sessão imediatamente.
- Se o agente estiver ocioso, a próxima execução usará o novo modelo imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de retry.
- Se a atividade de ferramenta ou a saída da resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade de retry posterior ou o próximo turno do usuário.
- `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, `baseUrl` + modo `api` do endpoint do provider).
- Referências de modelo são analisadas dividindo no **primeiro** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deverá incluir o prefixo do provider (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provider, o OpenClaw resolve a entrada nesta ordem:
  1. correspondência de alias
  2. correspondência única de provider configurado para aquele ID de modelo sem prefixo
  3. fallback obsoleto para o provider padrão configurado
     Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw
     recorre ao primeiro provider/modelo configurado para evitar
     exibir um padrão obsoleto de provider removido.

Comportamento/configuração completo do comando: [Slash commands](/pt-BR/tools/slash-commands).

Exemplos:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## Comandos CLI

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

Mostra modelos configurados por padrão. Flags úteis:

- `--all`: catálogo completo
- `--local`: apenas providers locais
- `--provider <id>`: filtrar por ID do provider, por exemplo `moonshot`; rótulos de exibição de seletores interativos não são aceitos
- `--plain`: um modelo por linha
- `--json`: saída legível por máquina

`--all` inclui linhas estáticas de catálogo de providers incluídos antes que a autenticação seja
configurada, então visualizações apenas de descoberta podem mostrar modelos indisponíveis até
que você adicione credenciais correspondentes do provider.

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral da autenticação
dos providers configurados. Também expõe o status de expiração de OAuth para perfis encontrados
no armazenamento de autenticação (avisa dentro de 24h por padrão). `--plain` imprime apenas o
modelo primário resolvido.
O status de OAuth é sempre mostrado (e incluído na saída `--json`). Se um provider configurado
não tiver credenciais, `models status` imprime uma seção **Missing auth**.
O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(autenticação efetiva por provider, incluindo credenciais com suporte de env). `auth.oauth`
mostra apenas a integridade dos perfis do auth-store; providers apenas de env não aparecem ali.
Use `--check` para automação (código de saída `1` quando ausente/expirado, `2` quando expirando).
Use `--probe` para verificações de autenticação ao vivo; linhas de sondagem podem vir de perfis de autenticação, credenciais de env
ou `models.json`.
Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem informará
`excluded_by_auth_order` em vez de tentar usá-lo. Se houver autenticação, mas nenhum
modelo sondável puder ser resolvido para esse provider, a sondagem informará `status: no_model`.

A escolha de autenticação depende do provider/conta. Para hosts de gateway sempre ativos, chaves de API
geralmente são a opção mais previsível; reutilização do Claude CLI e perfis existentes de OAuth/token do Anthropic também são compatíveis.

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Verificação (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode
opcionalmente sondar modelos para suporte a ferramentas e imagens.

Principais flags:

- `--no-probe`: ignora sondagens ao vivo (somente metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: ignorar modelos mais antigos
- `--provider <name>`: filtro por prefixo de provider
- `--max-candidates <n>`: tamanho da lista de fallbacks
- `--set-default`: define `agents.defaults.model.primary` como a primeira seleção
- `--set-image`: define `agents.defaults.imageModel.primary` como a primeira seleção de imagem

A sondagem exige uma chave de API do OpenRouter (de perfis de autenticação ou
`OPENROUTER_API_KEY`). Sem uma chave, use `--no-probe` para listar apenas candidatos.

Os resultados da verificação são classificados por:

1. Suporte a imagem
2. Latência de ferramentas
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Exige chave de API do OpenRouter a partir de perfis de autenticação ou `OPENROUTER_API_KEY` (consulte [/environment](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondagem: `--timeout`, `--concurrency`

Quando executado em um TTY, você pode selecionar fallbacks interativamente. Em modo não interativo,
passe `--yes` para aceitar os padrões.

## Registro de modelos (`models.json`)

Providers personalizados em `models.providers` são gravados em `models.json` no
diretório do agente (por padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo
é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

Precedência do modo de mesclagem para IDs de provider correspondentes:

- Um `baseUrl` não vazio já presente em `models.json` do agente tem prioridade.
- Um `apiKey` não vazio em `models.json` do agente tem prioridade apenas quando esse provider não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
- Valores `apiKey` de providers gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
- Valores de header de providers gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec).
- `apiKey`/`baseUrl` do agente vazios ou ausentes recorrem a `models.providers` da configuração.
- Outros campos do provider são atualizados a partir da configuração e de dados de catálogo normalizados.

A persistência de marcadores é autoritativa pela origem: o OpenClaw grava marcadores do snapshot da configuração de origem ativa (pré-resolução), não de valores de segredos resolvidos em runtime.
Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando como `openclaw agent`.

## Relacionado

- [Providers de Modelos](/pt-BR/concepts/model-providers) — roteamento de provider e autenticação
- [Failover de Modelo](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Geração de Imagem](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Geração de Música](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Geração de Vídeo](/pt-BR/tools/video-generation) — configuração de modelo de vídeo
- [Referência de Configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
