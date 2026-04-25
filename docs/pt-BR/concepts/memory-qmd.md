---
read_when:
    - Você quer configurar o QMD como seu backend de memória
    - Você quer recursos avançados de memória, como reranking ou caminhos indexados extras
summary: Sidecar de busca local-first com BM25, vetores, reranking e expansão de consulta
title: Motor de memória QMD
x-i18n:
    generated_at: "2026-04-25T13:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) é um sidecar de busca local-first que roda
junto com o OpenClaw. Ele combina BM25, busca vetorial e reranking em um único
binário, e pode indexar conteúdo além dos arquivos de memória do seu workspace.

## O que ele adiciona em relação ao builtin

- **Reranking e expansão de consulta** para melhor recall.
- **Indexa diretórios extras** -- documentação do projeto, notas da equipe, qualquer coisa em disco.
- **Indexa transcrições de sessão** -- relembra conversas anteriores.
- **Totalmente local** -- roda com o pacote de runtime opcional node-llama-cpp e
  baixa automaticamente modelos GGUF.
- **Fallback automático** -- se o QMD não estiver disponível, o OpenClaw faz fallback para o
  motor builtin de forma transparente.

## Primeiros passos

### Pré-requisitos

- Instale o QMD: `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Build do SQLite que permita extensões (`brew install sqlite` no macOS).
- O QMD precisa estar no `PATH` do gateway.
- macOS e Linux funcionam imediatamente. No Windows, o melhor suporte é via WSL2.

### Ativar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

O OpenClaw cria uma home autocontida do QMD em
`~/.openclaw/agents/<agentId>/qmd/` e gerencia automaticamente o ciclo de vida do sidecar
-- coleções, atualizações e execuções de embedding são tratadas para você.
Ele prefere os formatos atuais de coleção QMD e consulta MCP, mas ainda faz fallback para
flags legadas de coleção `--mask` e nomes antigos de ferramentas MCP quando necessário.
A reconciliação na inicialização também recria coleções gerenciadas desatualizadas de volta para seus
padrões canônicos quando uma coleção antiga do QMD com o mesmo nome ainda está
presente.

## Como o sidecar funciona

- O OpenClaw cria coleções a partir dos arquivos de memória do seu workspace e de quaisquer
  `memory.qmd.paths` configurados, depois executa `qmd update` + `qmd embed` na inicialização
  e periodicamente (padrão: a cada 5 minutos).
- A coleção padrão do workspace acompanha `MEMORY.md` mais a
  árvore `memory/`. `memory.md` em minúsculas não é indexado como arquivo de memória raiz.
- A atualização na inicialização roda em segundo plano para não bloquear a inicialização do chat.
- As buscas usam o `searchMode` configurado (padrão: `search`; também oferece suporte a
  `vsearch` e `query`). Se um modo falhar, o OpenClaw tenta novamente com `qmd query`.
- Se o QMD falhar completamente, o OpenClaw faz fallback para o motor SQLite builtin.

<Info>
A primeira busca pode ser lenta -- o QMD baixa automaticamente modelos GGUF (~2 GB) para
reranking e expansão de consulta na primeira execução de `qmd query`.
</Info>

## Sobrescritas de modelo

As variáveis de ambiente de modelo do QMD são repassadas sem alterações pelo processo do gateway,
então você pode ajustar o QMD globalmente sem adicionar nova configuração do OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Depois de alterar o modelo de embedding, execute novamente os embeddings para que o índice corresponda ao
novo espaço vetorial.

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
resultados de busca. `memory_get` entende esse prefixo e lê a partir da raiz da coleção correta.

## Indexando transcrições de sessão

Ative a indexação de sessão para relembrar conversas anteriores:

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

As transcrições são exportadas como turnos sanitizados de User/Assistant para uma coleção QMD dedicada
em `~/.openclaw/agents/<id>/qmd/sessions/`.

## Escopo de busca

Por padrão, os resultados de busca do QMD aparecem em sessões diretas e de canal
(não em grupos). Configure `memory.qmd.scope` para alterar isso:

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
o tipo de chat, para que resultados vazios sejam mais fáceis de depurar.

## Citações

Quando `memory.citations` é `auto` ou `on`, trechos de busca incluem um
rodapé `Source: <path#line>`. Defina `memory.citations = "off"` para omitir o rodapé
enquanto ainda passa o caminho internamente ao agente.

## Quando usar

Escolha o QMD quando você precisar de:

- Reranking para resultados de maior qualidade.
- Buscar documentação do projeto ou notas fora do workspace.
- Relembrar conversas de sessões passadas.
- Busca totalmente local sem chaves de API.

Para configurações mais simples, o [motor builtin](/pt-BR/concepts/memory-builtin) funciona bem
sem dependências extras.

## Solução de problemas

**QMD não encontrado?** Garanta que o binário esteja no `PATH` do gateway. Se o OpenClaw
rodar como serviço, crie um symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Primeira busca muito lenta?** O QMD baixa modelos GGUF no primeiro uso. Pré-aqueça
com `qmd query "test"` usando os mesmos diretórios XDG usados pelo OpenClaw.

**A busca expira?** Aumente `memory.qmd.limits.timeoutMs` (padrão: 4000ms).
Defina `120000` para hardware mais lento.

**Resultados vazios em chats de grupo?** Verifique `memory.qmd.scope` -- o padrão só
permite sessões diretas e de canal.

**A busca de memória raiz de repente ficou ampla demais?** Reinicie o gateway ou aguarde
a próxima reconciliação na inicialização. O OpenClaw recria coleções gerenciadas desatualizadas
de volta aos padrões canônicos de `MEMORY.md` e `memory/` quando detecta um conflito
de mesmo nome.

**Repositórios temporários visíveis no workspace causando `ENAMETOOLONG` ou indexação quebrada?**
Atualmente, a travessia do QMD segue o comportamento do scanner subjacente do QMD, e não
as regras builtin de symlink do OpenClaw. Mantenha checkouts temporários de monorepo em
diretórios ocultos como `.tmp/` ou fora das raízes indexadas pelo QMD até que o QMD exponha
travessia segura contra ciclos ou controles explícitos de exclusão.

## Configuração

Para a superfície completa de configuração (`memory.qmd.*`), modos de busca, intervalos
de atualização, regras de escopo e todos os outros controles, consulte a
[Referência de configuração de memória](/pt-BR/reference/memory-config).

## Relacionados

- [Visão geral da memória](/pt-BR/concepts/memory)
- [Motor de memória builtin](/pt-BR/concepts/memory-builtin)
- [Memória Honcho](/pt-BR/concepts/memory-honcho)
