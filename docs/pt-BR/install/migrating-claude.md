---
read_when:
    - Você vem do Claude Code ou do Claude Desktop e quer manter instruções, servidores MCP e Skills
    - Você precisa entender o que o OpenClaw importa automaticamente e o que permanece apenas no arquivo
summary: Mova o estado local do Claude Code e do Claude Desktop para o OpenClaw com uma importação com prévia
title: Migrando do Claude
x-i18n:
    generated_at: "2026-04-30T09:55:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

O OpenClaw importa o estado local do Claude por meio do provedor de migração Claude incluído. O provedor pré-visualiza todos os itens antes de alterar o estado, redige segredos em planos e relatórios, e cria um backup verificado antes de aplicar.

<Note>
Importações de integração exigem uma configuração nova do OpenClaw. Se você já tem estado local do OpenClaw, primeiro redefina configuração, credenciais, sessões e o workspace, ou use `openclaw migrate` diretamente com `--overwrite` depois de revisar o plano.
</Note>

## Duas formas de importar

<Tabs>
  <Tab title="Onboarding wizard">
    O assistente oferece Claude quando detecta estado local do Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Ou aponte para uma origem específica:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Use `openclaw migrate` para execuções com script ou repetíveis. Consulte [`openclaw migrate`](/pt-BR/cli/migrate) para a referência completa.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Adicione `--from <path>` para importar um diretório home ou raiz de projeto específico do Claude Code.

  </Tab>
</Tabs>

## O que é importado

<AccordionGroup>
  <Accordion title="Instructions and memory">
    - O conteúdo de `CLAUDE.md` e `.claude/CLAUDE.md` do projeto é copiado ou anexado ao `AGENTS.md` do workspace do agente OpenClaw.
    - O conteúdo de `~/.claude/CLAUDE.md` do usuário é anexado ao `USER.md` do workspace.

  </Accordion>
  <Accordion title="MCP servers">
    As definições de servidores MCP são importadas de `.mcp.json` do projeto, `~/.claude.json` do Claude Code e `claude_desktop_config.json` do Claude Desktop quando presentes.
  </Accordion>
  <Accordion title="Skills and commands">
    - Skills do Claude com um arquivo `SKILL.md` são copiadas para o diretório de Skills do workspace do OpenClaw.
    - Arquivos Markdown de comandos do Claude em `.claude/commands/` ou `~/.claude/commands/` são convertidos em Skills do OpenClaw com `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## O que permanece apenas no arquivo

O provedor copia estes itens para o relatório de migração para revisão manual, mas **não** os carrega na configuração ativa do OpenClaw:

- Hooks do Claude
- Permissões do Claude e listas amplas de permissão de ferramentas
- Padrões de ambiente do Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagentes do Claude em `.claude/agents/` ou `~/.claude/agents/`
- Caches, planos e diretórios de histórico de projetos do Claude Code
- Extensões do Claude Desktop e credenciais armazenadas pelo SO

O OpenClaw se recusa a executar hooks, confiar em listas de permissão ou decodificar automaticamente estado opaco de credenciais OAuth e Desktop. Mova manualmente o que você precisar depois de revisar o arquivo.

## Seleção de origem

Sem `--from`, o OpenClaw inspeciona o diretório home padrão do Claude Code em `~/.claude`, o arquivo de estado amostrado `~/.claude.json` do Claude Code e a configuração MCP do Claude Desktop no macOS.

Quando `--from` aponta para uma raiz de projeto, o OpenClaw importa apenas os arquivos Claude desse projeto, como `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` e `.mcp.json`. Ele não lê seu diretório home global do Claude durante uma importação de raiz de projeto.

## Fluxo recomendado

<Steps>
  <Step title="Preview the plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    O plano lista tudo que será alterado, incluindo conflitos, itens ignorados e valores sensíveis redigidos de campos MCP `env` ou `headers` aninhados.

  </Step>
  <Step title="Apply with backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    O OpenClaw cria e verifica um backup antes de aplicar.

  </Step>
  <Step title="Run doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/pt-BR/gateway/doctor) verifica problemas de configuração ou estado após a importação.

  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirme se o Gateway está saudável e se suas instruções, servidores MCP e Skills importados foram carregados.

  </Step>
</Steps>

## Tratamento de conflitos

A aplicação se recusa a continuar quando o plano relata conflitos (um arquivo ou valor de configuração já existe no destino).

<Warning>
Execute novamente com `--overwrite` somente quando substituir o destino existente for intencional. Os provedores ainda podem gravar backups por item para arquivos sobrescritos no diretório de relatório de migração.
</Warning>

Para uma instalação nova do OpenClaw, conflitos são incomuns. Eles normalmente aparecem quando você executa novamente a importação em uma configuração que já tem edições do usuário.

## Saída JSON para automação

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Com `--json` e sem `--yes`, a aplicação imprime o plano e não altera o estado. Esse é o modo mais seguro para CI e scripts compartilhados.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Claude state lives outside ~/.claude">
    Passe `--from /actual/path` (CLI) ou `--import-source /actual/path` (integração).
  </Accordion>
  <Accordion title="Onboarding refuses to import on an existing setup">
    Importações de integração exigem uma configuração nova. Redefina o estado e refaça a integração, ou use `openclaw migrate apply claude` diretamente, que oferece suporte a `--overwrite` e controle explícito de backup.
  </Accordion>
  <Accordion title="MCP servers from Claude Desktop did not import">
    O Claude Desktop lê `claude_desktop_config.json` de um caminho específico da plataforma. Aponte `--from` para o diretório desse arquivo se o OpenClaw não o detectou automaticamente.
  </Accordion>
  <Accordion title="Claude commands became skills with model invocation disabled">
    Por design. Comandos do Claude são acionados pelo usuário, então o OpenClaw os importa como Skills com `disable-model-invocation: true`. Edite o frontmatter de cada Skill se quiser que o agente as invoque automaticamente.
  </Accordion>
</AccordionGroup>

## Relacionados

- [`openclaw migrate`](/pt-BR/cli/migrate): referência completa da CLI, contrato de Plugin e formatos JSON.
- [Guia de migração](/pt-BR/install/migrating): todos os caminhos de migração.
- [Migrando do Hermes](/pt-BR/install/migrating-hermes): o outro caminho de importação entre sistemas.
- [Integração](/pt-BR/cli/onboard): fluxo do assistente e flags não interativas.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade pós-migração.
- [Workspace do agente](/pt-BR/concepts/agent-workspace): onde ficam `AGENTS.md`, `USER.md` e Skills.
