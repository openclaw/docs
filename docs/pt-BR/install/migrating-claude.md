---
read_when:
    - Você está migrando do Claude Code ou Claude Desktop e quer manter instruções, servidores MCP e Skills
    - Você precisa entender o que o OpenClaw importa automaticamente e o que permanece apenas no arquivo morto
summary: Migre o estado local do Claude Code e do Claude Desktop para o OpenClaw com uma importação pré-visualizada
title: Migração do Claude
x-i18n:
    generated_at: "2026-07-12T15:22:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

O OpenClaw importa o estado local do Claude por meio do provedor integrado de migração do Claude. O provedor apresenta uma prévia de cada item antes de alterar o estado, oculta segredos nos planos e relatórios e cria um backup verificado antes da aplicação.

<Note>
As importações durante a integração inicial exigem uma configuração nova do OpenClaw. Se você já tiver um estado local do OpenClaw, primeiro redefina a configuração, as credenciais, as sessões e o espaço de trabalho ou use `openclaw migrate` diretamente com `--overwrite` após revisar o plano.
</Note>

## Duas maneiras de importar

<Tabs>
  <Tab title="Assistente de integração inicial">
    O assistente oferece o Claude como opção quando detecta um estado local do Claude.

    ```bash
    openclaw onboard --flow import
    ```

    Ou indique uma origem específica:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Use `openclaw migrate` para execuções com scripts ou repetíveis. Consulte [`openclaw migrate`](/pt-BR/cli/migrate) para ver a referência completa.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Adicione `--from <path>` para importar um diretório inicial do Claude Code ou uma raiz de projeto específica.

  </Tab>
</Tabs>

## O que é importado

<AccordionGroup>
  <Accordion title="Instruções e memória">
    - O conteúdo de `CLAUDE.md` e `.claude/CLAUDE.md` do projeto é copiado ou acrescentado ao `AGENTS.md` do espaço de trabalho do agente do OpenClaw.
    - O conteúdo de `~/.claude/CLAUDE.md` do usuário é acrescentado ao `USER.md` do espaço de trabalho.

  </Accordion>
  <Accordion title="Servidores MCP">
    As definições de servidores MCP são importadas de `.mcp.json` do projeto, `~/.claude.json` do Claude Code e `claude_desktop_config.json` do Claude Desktop, quando presentes.
  </Accordion>
  <Accordion title="Skills e comandos">
    - As Skills do Claude que contêm um arquivo `SKILL.md` são copiadas para o diretório de Skills do espaço de trabalho do OpenClaw.
    - Os arquivos Markdown de comandos do Claude em `.claude/commands/` ou `~/.claude/commands/` são convertidos em Skills do OpenClaw com `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## O que permanece apenas no arquivo de migração

O provedor copia os itens a seguir para o relatório de migração para revisão manual, mas **não** os carrega na configuração ativa do OpenClaw:

- Hooks do Claude
- Permissões do Claude e listas amplas de ferramentas permitidas
- Padrões de ambiente do Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagentes do Claude em `.claude/agents/` ou `~/.claude/agents/`
- Diretórios de cache, planos e histórico de projetos do Claude Code
- Extensões do Claude Desktop e credenciais armazenadas pelo sistema operacional

O OpenClaw se recusa a executar hooks, confiar em listas de permissões ou decodificar automaticamente o estado opaco de credenciais OAuth e do Desktop. Após revisar o arquivo de migração, mova manualmente o que for necessário.

## Seleção da origem

Sem `--from`, o OpenClaw inspeciona o diretório inicial padrão do Claude Code em `~/.claude`, o arquivo de estado amostrado `~/.claude.json` do Claude Code e a configuração MCP do Claude Desktop no macOS.

Quando `--from` aponta para a raiz de um projeto, o OpenClaw importa apenas os arquivos do Claude desse projeto, como `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` e `.mcp.json`. Durante uma importação da raiz do projeto, ele não lê o diretório inicial global do Claude.

## Fluxo recomendado

<Steps>
  <Step title="Visualizar o plano">
    ```bash
    openclaw migrate claude --dry-run
    ```

    O plano lista tudo o que será alterado, incluindo conflitos, itens ignorados e valores confidenciais ocultados dos campos aninhados `env` ou `headers` do MCP.

  </Step>
  <Step title="Aplicar com backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    O OpenClaw cria e verifica um backup antes da aplicação.

  </Step>
  <Step title="Executar o doctor">
    ```bash
    openclaw doctor
    ```

    O [Doctor](/pt-BR/gateway/doctor) verifica se há problemas de configuração ou estado após a importação.

  </Step>
  <Step title="Reiniciar e verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirme se o Gateway está íntegro e se as instruções, os servidores MCP e as Skills importados foram carregados.

  </Step>
</Steps>

## Tratamento de conflitos

A aplicação se recusa a continuar quando o plano relata conflitos (um arquivo ou valor de configuração já existe no destino).

<Warning>
Execute novamente com `--overwrite` somente quando a substituição do destino existente for intencional. Os provedores ainda podem criar backups individuais dos arquivos substituídos no diretório do relatório de migração.
</Warning>

Em uma instalação nova do OpenClaw, os conflitos são incomuns. Eles geralmente aparecem quando você executa novamente a importação em uma configuração que já contém edições do usuário.

## Saída JSON para automação

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` é obrigatório para `migrate apply` fora de um terminal interativo; sem essa opção, o OpenClaw retorna um erro em vez de aplicar as alterações. Portanto, scripts e sistemas de CI devem fornecer `--yes` explicitamente. Primeiro, visualize com `--dry-run --json` e, quando o plano estiver correto, aplique com `--json --yes`.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O estado do Claude está fora de ~/.claude">
    Forneça `--from /actual/path` (CLI) ou `--import-source /actual/path` (integração inicial).
  </Accordion>
  <Accordion title="A integração inicial se recusa a importar em uma configuração existente">
    As importações durante a integração inicial exigem uma configuração nova. Redefina o estado e refaça a integração inicial ou use `openclaw migrate apply claude` diretamente, que oferece suporte a `--overwrite` e ao controle explícito de backups.
  </Accordion>
  <Accordion title="Os servidores MCP do Claude Desktop não foram importados">
    O Claude Desktop lê `claude_desktop_config.json` de um caminho específico da plataforma. Aponte `--from` para o diretório desse arquivo se o OpenClaw não o tiver detectado automaticamente.
  </Accordion>
  <Accordion title="Os comandos do Claude se tornaram Skills com a invocação pelo modelo desativada">
    Isso é intencional. Os comandos do Claude são acionados pelo usuário, portanto o OpenClaw os importa como Skills com `disable-model-invocation: true`. Edite o frontmatter de cada Skill se quiser que o agente as invoque automaticamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [`openclaw migrate`](/pt-BR/cli/migrate): referência completa da CLI, contrato do Plugin e formatos JSON.
- [Guia de migração](/pt-BR/install/migrating): todos os caminhos de migração.
- [Migração do Hermes](/pt-BR/install/migrating-hermes): o outro caminho de importação entre sistemas.
- [Integração inicial](/pt-BR/cli/onboard): fluxo do assistente e opções não interativas.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após a migração.
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace): onde ficam `AGENTS.md`, `USER.md` e as Skills.
