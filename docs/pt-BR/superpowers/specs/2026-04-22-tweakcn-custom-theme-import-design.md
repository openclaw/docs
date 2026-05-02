---
x-i18n:
    generated_at: "2026-05-02T22:22:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Design de Importação de Tema Personalizado do Tweakcn

Status: aprovado no terminal em 2026-04-22

## Resumo

Adicione exatamente um slot personalizado local ao navegador para tema da Interface de Controle que possa ser importado a partir de um link de compartilhamento do tweakcn. As famílias de temas integradas existentes continuam sendo `claw`, `knot` e `dash`. A nova família `custom` se comporta como uma família de temas normal do OpenClaw e oferece suporte aos modos `light`, `dark` e `system` quando o payload importado do tweakcn inclui conjuntos de tokens claros e escuros.

O tema importado é armazenado apenas no perfil atual do navegador com o restante das configurações da Interface de Controle. Ele não é gravado na configuração do gateway e não é sincronizado entre dispositivos ou navegadores.

## Problema

O sistema de temas da Interface de Controle atualmente está fechado sobre três famílias de temas codificadas de forma rígida:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Os usuários podem alternar entre famílias integradas e variantes de modo, mas não conseguem trazer um tema do tweakcn sem editar o CSS do repositório. O resultado solicitado é menor do que um sistema geral de temas: manter os três temas integrados e adicionar um slot importado controlado pelo usuário que possa ser substituído por um link do tweakcn.

## Objetivos

- Manter as famílias de temas integradas existentes inalteradas.
- Adicionar exatamente um slot personalizado importado, não uma biblioteca de temas.
- Aceitar um link de compartilhamento do tweakcn ou uma URL direta `https://tweakcn.com/r/themes/{id}`.
- Persistir o tema importado apenas no armazenamento local do navegador.
- Fazer o slot importado funcionar com os controles de modo `light`, `dark` e `system` existentes.
- Manter o comportamento de falha seguro: uma importação incorreta nunca quebra o tema ativo da interface.

## Não objetivos

- Nenhuma biblioteca multitema ou lista local do navegador de importações.
- Nenhuma persistência no Gateway ou sincronização entre dispositivos.
- Nenhum editor arbitrário de CSS ou editor de JSON bruto de tema.
- Nenhum carregamento automático de ativos de fonte remotos do tweakcn.
- Nenhuma tentativa de oferecer suporte a payloads do tweakcn que expõem apenas um modo.
- Nenhuma refatoração de temas em todo o repositório além das interfaces necessárias para a Interface de Controle.

## Decisões do usuário já tomadas

- Manter os três temas integrados.
- Adicionar um slot de importação alimentado pelo tweakcn.
- Armazenar o tema importado no navegador, não na configuração do Gateway.
- Oferecer suporte a `light`, `dark` e `system` para o slot importado.
- Sobrescrever o slot personalizado com a próxima importação é o comportamento pretendido.

## Abordagem recomendada

Adicione um quarto id de família de tema, `custom`, ao modelo de temas da Interface de Controle. A família `custom` se torna selecionável apenas quando uma importação válida do tweakcn está presente. O payload importado é normalizado em um registro de tema personalizado específico do OpenClaw e armazenado no armazenamento local do navegador com o restante das configurações da interface.

Em tempo de execução, o OpenClaw renderiza uma tag `<style>` gerenciada que define os blocos resolvidos de variáveis CSS personalizadas:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Isso mantém as variáveis do tema personalizado com escopo restrito à família `custom` e evita vazar variáveis CSS inline para as famílias integradas.

## Arquitetura

### Modelo de tema

Atualize `ui/src/ui/theme.ts`:

- Estenda `ThemeName` para incluir `custom`.
- Estenda `ResolvedTheme` para incluir `custom` e `custom-light`.
- Estenda `VALID_THEME_NAMES`.
- Atualize `resolveTheme()` para que `custom` espelhe o comportamento da família existente:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` ou `custom-light` com base na preferência do SO

Nenhum alias legado é adicionado para `custom`.

### Modelo de persistência

Estenda a persistência de `UiSettings` em `ui/src/ui/storage.ts` com um payload opcional de tema personalizado:

- `customTheme?: ImportedCustomTheme`

Formato armazenado recomendado:

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

- `sourceUrl` armazena a entrada original do usuário após a normalização.
- `themeId` é o id do tema do tweakcn extraído da URL.
- `label` é o campo `name` do tweakcn quando presente; caso contrário, `Custom`.
- `light` e `dark` já são mapas de tokens normalizados do OpenClaw, não payloads brutos do tweakcn.
- O payload importado fica ao lado de outras configurações locais do navegador e é serializado no mesmo documento de armazenamento local.
- Se os dados armazenados do tema personalizado estiverem ausentes ou forem inválidos no carregamento, ignore o payload e volte para `theme: "claw"` quando a família persistida for `custom`.

### Aplicação em tempo de execução

Adicione um gerenciador estreito de folha de estilos de tema personalizado no runtime da Interface de Controle, mantido perto de `ui/src/ui/app-settings.ts` e `ui/src/ui/theme.ts`.

Responsabilidades:

- Criar ou atualizar uma tag `<style id="openclaw-custom-theme">` estável em `document.head`.
- Emitir CSS apenas quando existir um payload de tema personalizado válido.
- Remover o conteúdo da tag de estilo quando o payload for limpo.
- Manter o CSS das famílias integradas em `ui/src/styles/base.css`; não emendar tokens importados na folha de estilos versionada.

Esse gerenciador roda sempre que as configurações são carregadas, salvas, importadas ou limpas.

### Seletores de modo claro

A implementação deve preferir `data-theme-mode="light"` para estilização clara entre famílias, em vez de tratar `custom-light` como caso especial. Se um seletor existente estiver fixado em `data-theme="light"` e precisar se aplicar a todas as famílias claras, amplie-o como parte deste trabalho.

## UX de importação

Atualize `ui/src/ui/views/config.ts` na seção `Appearance`:

- Adicione um cartão de tema `Custom` ao lado de `Claw`, `Knot` e `Dash`.
- Mostre o cartão como desabilitado quando nenhum tema personalizado importado existir.
- Adicione um painel de importação abaixo da grade de temas com:
  - uma entrada de texto para um link de compartilhamento do tweakcn ou URL `/r/themes/{id}`
  - um botão `Import`
  - um caminho `Replace` quando um payload personalizado já existir
  - uma ação `Clear` quando um payload personalizado já existir
- Mostre o rótulo do tema importado e o host de origem quando um payload existir.
- Se o tema ativo for `custom`, importar uma substituição aplica imediatamente.
- Se o tema ativo não for `custom`, a importação apenas armazena o novo payload até que o usuário selecione o cartão `Custom`.

O seletor rápido de temas em `ui/src/ui/views/config-quick.ts` também deve mostrar `Custom` apenas quando existir um payload.

## Análise de URL e busca remota

O caminho de importação do navegador aceita:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

A implementação deve normalizar os dois formatos para:

- `https://tweakcn.com/r/themes/{id}`

Então o navegador busca diretamente o endpoint `/r/themes/{id}` normalizado.

Use um validador de esquema estreito para o payload externo. Um esquema zod é preferido porque este é um limite externo não confiável.

Campos remotos obrigatórios:

- `name` de nível superior como string opcional
- `cssVars.theme` como objeto opcional
- `cssVars.light` como objeto
- `cssVars.dark` como objeto

Se `cssVars.light` ou `cssVars.dark` estiver ausente, rejeite a importação. Isso é deliberado: o comportamento de produto aprovado é suporte completo a modos, não síntese de melhor esforço do lado ausente.

## Mapeamento de tokens

Não espelhe variáveis do tweakcn cegamente. Normalize um subconjunto limitado em tokens do OpenClaw e derive o restante em um auxiliar.

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

De `cssVars.theme` compartilhado quando presente:

- `font-sans`
- `font-mono`

Se um bloco de modo sobrescrever `font-sans`, `font-mono` ou `radius`, o valor local do modo vence.

### Tokens derivados para o OpenClaw

O importador deriva variáveis exclusivas do OpenClaw a partir das cores base importadas:

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

As regras de derivação vivem em um auxiliar puro para que possam ser testadas independentemente. As fórmulas exatas de mistura de cores são um detalhe de implementação, mas o auxiliar deve satisfazer duas restrições:

- preservar contraste legível próximo à intenção do tema importado
- produzir saída estável para o mesmo payload importado

### Tokens ignorados na v1

Estes tokens do tweakcn são ignorados intencionalmente na primeira versão:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Isso mantém o escopo nos tokens de que a Interface de Controle atual realmente precisa.

### Fontes

Strings de pilha de fontes são importadas se presentes, mas o OpenClaw não carrega ativos de fonte remotos na v1. Se a pilha importada referenciar fontes indisponíveis no navegador, o comportamento normal de fallback se aplica.

## Comportamento de falha

Importações incorretas devem falhar fechadas.

- Formato de URL inválido: mostrar erro de validação inline, não buscar.
- Host ou formato de caminho sem suporte: mostrar erro de validação inline, não buscar.
- Falha de rede, resposta não OK ou JSON malformado: mostrar erro inline, manter o payload armazenado atual intacto.
- Falha de esquema ou blocos claro/escuro ausentes: mostrar erro inline, manter o payload armazenado atual intacto.
- Ação de limpeza:
  - remove o payload personalizado armazenado
  - remove o conteúdo da tag de estilo personalizada gerenciada
  - se `custom` estiver ativo, troca a família de tema de volta para `claw`
- Payload personalizado armazenado inválido no primeiro carregamento:
  - ignora o payload armazenado
  - não emite CSS personalizado
  - se a família de tema persistida era `custom`, volta para `claw`

Em nenhum momento uma importação com falha deve deixar o documento ativo com variáveis CSS personalizadas parciais aplicadas.

## Arquivos esperados para mudar na implementação

Arquivos principais:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Novos auxiliares prováveis:

- `ui/src/ui/custom-theme.ts`

Testes:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- novos testes focados para análise de URL e normalização de payload

## Testes

Cobertura mínima de implementação:

- analisar URL de link de compartilhamento para obter o id de tema do tweakcn
- normalizar `/themes/{id}` e `/r/themes/{id}` para a URL de busca
- rejeitar hosts sem suporte e ids malformados
- validar o formato do payload do tweakcn
- mapear um payload válido do tweakcn para mapas de tokens claros e escuros normalizados do OpenClaw
- carregar e salvar o payload personalizado em configurações locais do navegador
- resolver `custom` para `light`, `dark` e `system`
- desabilitar a seleção de `Custom` quando nenhum payload existir
- aplicar o tema importado imediatamente quando `custom` já estiver ativo
- voltar para `claw` quando o tema personalizado ativo for limpo

Alvo de verificação manual:

- importar um tema conhecido do tweakcn em Configurações
- alternar entre `light`, `dark` e `system`
- alternar entre `custom` e as famílias integradas
- recarregar a página e confirmar que o tema personalizado importado persiste localmente

## Observações de lançamento

Este recurso é intencionalmente pequeno. Se os usuários depois pedirem múltiplos temas importados, renomeação, exportação ou sincronização entre dispositivos, trate isso como um design subsequente. Não pré-construa uma abstração de biblioteca de temas nesta implementação.
