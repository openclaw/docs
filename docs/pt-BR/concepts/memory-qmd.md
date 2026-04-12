---
read_when:
    - Você quer configurar o QMD como seu backend de memória
    - Você quer recursos avançados de memória, como reranqueamento ou caminhos indexados extras
summary: Sidecar de busca local-first com BM25, vetores, reranqueamento e expansão de consulta
title: Mecanismo de Memória QMD
x-i18n:
    generated_at: "2026-04-12T23:28:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27afc996b959d71caed964a3cae437e0e29721728b30ebe7f014db124c88da04
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Mecanismo de Memória QMD

[QMD](https://github.com/tobi/qmd) é um sidecar de busca local-first que roda
ao lado do OpenClaw. Ele combina BM25, busca vetorial e reranqueamento em um
único binário, e pode indexar conteúdo além dos arquivos de memória do seu
workspace.

## O que ele adiciona em relação ao mecanismo builtin

- **Reranqueamento e expansão de consulta** para melhor recall.
- **Indexa diretórios extras** -- docs do projeto, notas da equipe, qualquer coisa no disco.
- **Indexa transcrições de sessão** -- relembra conversas anteriores.
- **Totalmente local** -- roda via Bun + node-llama-cpp, baixa automaticamente modelos GGUF.
- **Fallback automático** -- se o QMD não estiver disponível, o OpenClaw volta para o
  mecanismo builtin sem interrupções.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Build do SQLite que permita extensões (`brew install sqlite` no macOS).
- O QMD deve estar no `PATH` do gateway.
- macOS e Linux funcionam imediatamente. O Windows é melhor suportado via WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria um diretório home autocontido do QMD em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia automaticamente o ciclo de vida do sidecar
-- coleções, atualizações e execuções de embedding são tratadas para você.
Ele prefere os formatos atuais de coleção do QMD e de consulta MCP, mas ainda recorre a
flags legadas de coleção `--mask` e nomes antigos de ferramentas MCP quando necessário.

## Como o sidecar funciona

- O OpenClaw cria coleções a partir dos seus arquivos de memória do workspace e de quaisquer
  `memory.qmd.paths` configurados, depois executa `qmd update` + `qmd embed` na inicialização
  e periodicamente (o padrão é a cada 5 minutos).
- A coleção padrão do workspace acompanha `MEMORY.md` mais a árvore `memory/`.
  `memory.md` em minúsculas continua sendo um fallback de bootstrap, não uma coleção QMD separada.
- A atualização na inicialização roda em segundo plano para que o início do chat não seja bloqueado.
- As buscas usam o `searchMode` configurado (padrão: `search`; também suporta
  `vsearch` e `query`). Se um modo falhar, o OpenClaw tenta novamente com `qmd query`.
- Se o QMD falhar completamente, o OpenClaw volta para o mecanismo SQLite builtin.

<Info>
A primeira busca pode ser lenta -- o QMD baixa automaticamente modelos GGUF (~2 GB) para
reranqueamento e expansão de consulta na primeira execução de `qmd query`.
</Info>

## Sobrescritas de modelo

As variáveis de ambiente de modelo do QMD são repassadas sem alterações a partir do processo
do gateway, então você pode ajustar o QMD globalmente sem adicionar nova configuração do OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Depois de alterar o modelo de embedding, execute os embeddings novamente para que o índice corresponda
ao novo espaço vetorial.

## Indexando caminhos extras

Aponte o QMD para diretórios adicionais para torná-los pesquisáveis:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Trechos de caminhos extras aparecem como `qmd/<collection>/<relative-path>` nos
resultados de busca. `memory_get` entende esse prefixo e lê a partir da raiz correta
da coleção.

## Indexando transcrições de sessão

Habilite a indexação de sessão para relembrar conversas anteriores:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

As transcrições são exportadas como turnos sanitizados de Usuário/Assistant para uma coleção QMD dedicada
em `~/.openclaw/agents/<id>/qmd/sessions/`.

## Escopo de busca

Por padrão, os resultados de busca do QMD são exibidos em sessões diretas e de canal
(não em grupos). Configure `memory.qmd.scope` para mudar isso:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Quando o escopo nega uma busca, o OpenClaw registra um aviso com o canal derivado e
o tipo de chat para que resultados vazios sejam mais fáceis de depurar.

## Citações

Quando `memory.citations` é `auto` ou `on`, os trechos de busca incluem um rodapé
`Source: <path#line>`. Defina `memory.citations = "off"` para omitir o rodapé
enquanto ainda passa o caminho internamente para o agente.

## Quando usar

Escolha o QMD quando você precisar de:

- Reranqueamento para resultados de maior qualidade.
- Buscar docs de projeto ou notas fora do workspace.
- Relembrar conversas de sessões passadas.
- Busca totalmente local sem chaves de API.

Para configurações mais simples, o [mecanismo builtin](/pt-BR/concepts/memory-builtin) funciona bem
sem dependências extras.

## Solução de problemas

**QMD não encontrado?** Certifique-se de que o binário está no `PATH` do gateway. Se o OpenClaw
rodar como um serviço, crie um link simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Primeira busca muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Faça um pré-aquecimento
com `qmd query "test"` usando os mesmos diretórios XDG que o OpenClaw usa.

**A busca expira?** Aumente `memory.qmd.limits.timeoutMs` (padrão: 4000ms).
Defina como `120000` para hardware mais lento.

**Resultados vazios em chats de grupo?** Verifique `memory.qmd.scope` -- o padrão só
permite sessões diretas e de canal.

**Repositórios temporários visíveis no workspace causando `ENAMETOOLONG` ou indexação quebrada?**
A travessia do QMD atualmente segue o comportamento subjacente do scanner do QMD, em vez das
regras de symlink builtin do OpenClaw. Mantenha checkouts temporários de monorepo em
diretórios ocultos como `.tmp/` ou fora das raízes QMD indexadas até que o QMD exponha
travessia segura contra ciclos ou controles explícitos de exclusão.

## Configuração

Para toda a superfície de configuração (`memory.qmd.*`), modos de busca, intervalos de atualização,
regras de escopo e todos os outros ajustes, consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config).
