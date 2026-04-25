---
x-i18n:
    generated_at: "2026-04-25T13:56:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Design de importação de tema personalizado do Tweakcn

Status: aprovado no terminal em 2026-04-22

## Resumo

Adicionar exatamente um slot de tema personalizado local ao navegador para o Control UI, que pode ser importado a partir de um link de compartilhamento do tweakcn. As famílias de tema integradas existentes continuam sendo `claw`, `knot` e `dash`. A nova família `custom` se comporta como uma família de tema normal do OpenClaw e oferece suporte aos modos `light`, `dark` e `system` quando o payload importado do tweakcn inclui conjuntos de tokens tanto claros quanto escuros.

O tema importado é armazenado apenas no perfil atual do navegador, junto com o restante das configurações do Control UI. Ele não é gravado na configuração do Gateway e não sincroniza entre dispositivos ou navegadores.

## Problema

O sistema de temas do Control UI atualmente está fechado em torno de três famílias de tema codificadas de forma rígida:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Os usuários podem alternar entre famílias integradas e variantes de modo, mas não podem trazer um tema do tweakcn sem editar o CSS do repositório. O resultado solicitado é menor do que um sistema geral de temas: manter os três temas integrados e adicionar um slot importado controlado pelo usuário que pode ser substituído a partir de um link do tweakcn.

## Objetivos

- Manter inalteradas as famílias de tema integradas existentes.
- Adicionar exatamente um slot importado, não uma biblioteca de temas.
- Aceitar um link de compartilhamento do tweakcn ou uma URL direta `https://tweakcn.com/r/themes/{id}`.
- Persistir o tema importado apenas no armazenamento local do navegador.
- Fazer o slot importado funcionar com os controles existentes de modo `light`, `dark` e `system`.
- Manter o comportamento de falha seguro: uma importação inválida nunca quebra o tema ativo da UI.

## Não objetivos

- Nada de biblioteca com vários temas ou lista local ao navegador de importações.
- Nada de persistência no lado do Gateway ou sincronização entre dispositivos.
- Nada de editor arbitrário de CSS ou editor bruto de JSON de tema.
- Nada de carregamento automático de assets remotos de fonte a partir do tweakcn.
- Nada de tentativa de oferecer suporte a payloads do tweakcn que exponham apenas um modo.
- Nada de refatoração ampla do sistema de temas do repositório além das separações necessárias para o Control UI.

## Decisões do usuário já tomadas

- Manter os três temas integrados.
- Adicionar um slot de importação com suporte do tweakcn.
- Armazenar o tema importado no navegador, não na configuração do Gateway.
- Oferecer suporte a `light`, `dark` e `system` para o tema importado.
- Sobrescrever o slot personalizado com a próxima importação é o comportamento pretendido.

## Abordagem recomendada

Adicionar um quarto id de família de tema, `custom`, ao modelo de tema do Control UI. A família `custom` passa a ser selecionável apenas quando uma importação válida do tweakcn estiver presente. O payload importado é normalizado para um registro de tema personalizado específico do OpenClaw e armazenado no armazenamento local do navegador junto com o restante das configurações da UI.

Em tempo de execução, o OpenClaw renderiza uma tag `<style>` gerenciada que define os blocos resolvidos de variáveis CSS personalizadas:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Isso mantém as variáveis do tema personalizado com escopo na família `custom` e evita o vazamento de variáveis CSS inline para as famílias integradas.

## Arquitetura

### Modelo de tema

Atualizar `ui/src/ui/theme.ts`:

- Estender `ThemeName` para incluir `custom`.
- Estender `ResolvedTheme` para incluir `custom` e `custom-light`.
- Estender `VALID_THEME_NAMES`.
- Atualizar `resolveTheme()` para que `custom` replique o comportamento existente da família:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` ou `custom-light` com base na preferência do SO

Nenhum alias legado é adicionado para `custom`.

### Modelo de persistência

Estender a persistência de `UiSettings` em `ui/src/ui/storage.ts` com um payload opcional de tema personalizado:

- `customTheme?: ImportedCustomTheme`

Forma armazenada recomendada:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Observações:

- `sourceUrl` armazena a entrada original do usuário após normalização.
- `themeId` é o id do tema do tweakcn extraído da URL.
- `label` é o campo `name` do tweakcn quando presente; caso contrário, `Custom`.
- `light` e `dark` já são mapas de tokens normalizados do OpenClaw, não payloads brutos do tweakcn.
- O payload importado fica ao lado de outras configurações locais do navegador e é serializado no mesmo documento de armazenamento local.
- Se os dados armazenados do tema personalizado estiverem ausentes ou inválidos no carregamento, ignore o payload e volte para `theme: "claw"` quando a família persistida for `custom`.

### Aplicação em tempo de execução

Adicionar um gerenciador estreito de folha de estilo de tema personalizado no runtime do Control UI, mantido próximo de `ui/src/ui/app-settings.ts` e `ui/src/ui/theme.ts`.

Responsabilidades:

- Criar ou atualizar uma tag estável `<style id="openclaw-custom-theme">` em `document.head`.
- Emitir CSS apenas quando existir um payload de tema personalizado válido.
- Remover o conteúdo da tag de estilo quando o payload for limpo.
- Manter o CSS das famílias integradas em `ui/src/styles/base.css`; não inserir tokens importados na folha de estilo versionada.

Esse gerenciador é executado sempre que as configurações são carregadas, salvas, importadas ou limpas.

### Seletores do modo claro

A implementação deve preferir `data-theme-mode="light"` para estilização clara entre famílias, em vez de tratar `custom-light` como caso especial. Se algum seletor existente estiver preso a `data-theme="light"` e precisar se aplicar a toda família clara, amplie-o como parte deste trabalho.

## UX de importação

Atualizar `ui/src/ui/views/config.ts` na seção `Appearance`:

- Adicionar um card de tema `Custom` ao lado de `Claw`, `Knot` e `Dash`.
- Mostrar o card como desabilitado quando não existir tema personalizado importado.
- Adicionar um painel de importação abaixo da grade de temas com:
  - uma entrada de texto para um link de compartilhamento do tweakcn ou URL `/r/themes/{id}`
  - um botão `Import`
  - um caminho `Replace` quando já existir um payload personalizado
  - uma ação `Clear` quando já existir um payload personalizado
- Mostrar o rótulo do tema importado e o host de origem quando existir um payload.
- Se o tema ativo for `custom`, importar uma substituição aplica imediatamente.
- Se o tema ativo não for `custom`, a importação apenas armazena o novo payload até que o usuário selecione o card `Custom`.

O seletor rápido de tema em `ui/src/ui/views/config-quick.ts` também deve mostrar `Custom` apenas quando existir um payload.

## Análise de URL e busca remota

O caminho de importação no navegador aceita:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

A implementação deve normalizar ambos os formatos para:

- `https://tweakcn.com/r/themes/{id}`

O navegador então busca diretamente o endpoint normalizado `/r/themes/{id}`.

Use um validador de esquema estreito para o payload externo. Um esquema zod é preferível porque esta é uma borda externa não confiável.

Campos remotos obrigatórios:

- `name` no nível superior como string opcional
- `cssVars.theme` como objeto opcional
- `cssVars.light` como objeto
- `cssVars.dark` como objeto

Se `cssVars.light` ou `cssVars.dark` estiver ausente, rejeite a importação. Isso é deliberado: o comportamento de produto aprovado é suporte completo a modos, não síntese best-effort de um lado ausente.

## Mapeamento de tokens

Não replique cegamente as variáveis do tweakcn. Normalize um subconjunto limitado em tokens do OpenClaw e derive o restante em um helper.

### Tokens importados diretamente

De cada bloco de modo do tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

De `cssVars.theme` compartilhado, quando presente:

- `font-sans`
- `font-mono`

Se um bloco de modo sobrescrever `font-sans`, `font-mono` ou `radius`, o valor local do modo tem prioridade.

### Tokens derivados para OpenClaw

O importador deriva variáveis específicas do OpenClaw a partir das cores base importadas:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

As regras de derivação ficam em um helper puro para que possam ser testadas independentemente. As fórmulas exatas de mistura de cores são um detalhe de implementação, mas o helper deve satisfazer duas restrições:

- preservar contraste legível próximo da intenção do tema importado
- produzir saída estável para o mesmo payload importado

### Tokens ignorados na v1

Estes tokens do tweakcn são intencionalmente ignorados na primeira versão:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Isso mantém o escopo nos tokens que o Control UI atual realmente precisa.

### Fontes

Strings de pilha de fontes são importadas quando presentes, mas o OpenClaw não carrega assets remotos de fontes na v1. Se a pilha importada fizer referência a fontes indisponíveis no navegador, o comportamento normal de fallback se aplica.

## Comportamento de falha

Importações inválidas devem falhar de forma fechada.

- Formato de URL inválido: mostrar erro de validação inline, não buscar.
- Host ou formato de caminho não compatível: mostrar erro de validação inline, não buscar.
- Falha de rede, resposta não OK ou JSON malformado: mostrar erro inline, manter intacto o payload armazenado atual.
- Falha de esquema ou ausência dos blocos `light`/`dark`: mostrar erro inline, manter intacto o payload armazenado atual.
- Ação `Clear`:
  - remove o payload personalizado armazenado
  - remove o conteúdo da tag de estilo personalizada gerenciada
  - se `custom` estiver ativo, troca a família de tema de volta para `claw`
- Payload personalizado armazenado inválido no primeiro carregamento:
  - ignorar o payload armazenado
  - não emitir CSS personalizado
  - se a família de tema persistida for `custom`, voltar para `claw`

Em nenhum momento uma importação com falha deve deixar o documento ativo com variáveis CSS personalizadas parciais aplicadas.

## Arquivos esperados para mudança na implementação

Arquivos principais:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Prováveis novos helpers:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Testes:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- novos testes focados para análise de URL e normalização de payload

## Testes

Cobertura mínima da implementação:

- analisar URL de link de compartilhamento para obter o id do tema do tweakcn
- normalizar `/themes/{id}` e `/r/themes/{id}` para a URL de busca
- rejeitar hosts não compatíveis e ids malformados
- validar o formato do payload do tweakcn
- mapear um payload válido do tweakcn para mapas normalizados de tokens claros e escuros do OpenClaw
- carregar e salvar o payload personalizado nas configurações locais do navegador
- resolver `custom` para `light`, `dark` e `system`
- desabilitar a seleção de `Custom` quando não existir payload
- aplicar o tema importado imediatamente quando `custom` já estiver ativo
- voltar para `claw` quando o tema personalizado ativo for limpo

Meta de verificação manual:

- importar um tema conhecido do tweakcn em Settings
- alternar entre `light`, `dark` e `system`
- alternar entre `custom` e as famílias integradas
- recarregar a página e confirmar que o tema personalizado importado persiste localmente

## Observações de rollout

Este recurso é intencionalmente pequeno. Se os usuários depois pedirem vários temas importados, renomeação, exportação ou sincronização entre dispositivos, trate isso como um design posterior. Não construa preventivamente uma abstração de biblioteca de temas nesta implementação.
