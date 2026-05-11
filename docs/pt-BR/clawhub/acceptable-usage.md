---
read_when:
    - Analisando envios em busca de abuso ou violações de política
    - Escrevendo documentação de moderação ou runbooks de revisores
    - Decidindo se uma Skill deve ser ocultada ou se um usuário deve ser banido
summary: 'Política do marketplace: o que o ClawHub permite e o que ele não hospedará.'
x-i18n:
    generated_at: "2026-05-11T22:19:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Aceitável

Esta página descreve os tipos de Skills e conteúdo que o ClawHub aceita, e os fluxos de trabalho abusivos que ele não hospedará.

Estas regras são intencionalmente práticas. O que mais importa para nós são fluxos de abuso de ponta a ponta, não apenas palavras-chave isoladas. Se uma skill for criada para contornar defesas, abusar de plataformas, aplicar golpes, invadir a privacidade ou permitir comportamento não consensual, ela não pertence ao ClawHub.

## Padrões recentes que aceitamos explicitamente

- Trabalho de frontend e design system que usa componentes reais, tokens semânticos, estados acessíveis e fluxos de usuário testados.
- Composição shadcn/ui que usa componentes de origem instalados, aliases de projeto e variantes documentadas em vez de marcação pontual.
- Conversão de UI5 de JavaScript para TypeScript que preserva comentários, usa tipos UI5 concretos e mantém interfaces de controles geradas revisáveis.
- Revisão de segurança defensiva, ferramentas de moderação e prompts de detecção de abuso que mostram evidências e mantêm claros os limites de aprovação humana.
- Automação de fluxos de trabalho baseada em consentimento para contas pessoais ou de equipe com credenciais explícitas, configuração transparente e modos de simulação ou pré-visualização.
- Documentação, runbooks de migração, utilitários para desenvolvedores e fixtures de teste com escopo limitado ao software que oferecem suporte.

## Não aceitamos

- Fluxos de trabalho de contorno de segurança ou acesso não autorizado.
  - Exemplos: contorno de autenticação, tomada de conta, contorno de CAPTCHA, evasão de Cloudflare ou antibot, contorno de limite de taxa, scraping furtivo projetado para derrotar proteções, tomada de chamada ao vivo ou de agente, roubo de sessão reutilizável, aprovação automática de fluxos de pareamento para usuários não aprovados.

- Abuso de plataforma e evasão de banimento.
  - Exemplos: contas furtivas após banimentos, aquecimento/cultivo de contas, engajamento falso, cultivo de karma ou seguidores, automação de múltiplas contas, publicação em massa, bots de spam, automação de marketplace ou social criada para evitar detecção.

- Fraude, golpes e fluxos financeiros enganosos.
  - Exemplos: certificados falsos, faturas falsas, fluxos de pagamento enganosos, contato para golpe, prova social falsa, ferramentas que permitem gastar ou cobrar sem aprovação humana clara e controles transparentes, ou fluxos de identidade sintética criados para criar contas para fraude.

- Scraping, enriquecimento ou vigilância invasivos à privacidade.
  - Exemplos: scraping de dados de contato em escala para spam, doxxing, perseguição, extração de leads combinada com contato não solicitado, monitoramento encoberto, busca facial ou correspondência biométrica usada sem consentimento claro, ou compra, publicação, download ou operacionalização de dados vazados ou dumps de violações.

- Personificação não consensual ou manipulação enganosa de identidade.
  - Exemplos: troca de rosto, gêmeos digitais, personas falsas, influenciadores clonados ou outras ferramentas de manipulação de identidade usadas para personificar ou enganar.

- Conteúdo sexual explícito e geração adulta com segurança desativada.
  - Exemplos: geração de imagem/vídeo/conteúdo NSFW, wrappers de conteúdo adulto em torno de APIs de terceiros, ou Skills cujo objetivo principal é conteúdo sexual explícito.

- Requisitos de execução ocultos, inseguros ou enganosos.
  - Exemplos: comandos de instalação ofuscados, `curl | sh`, requisitos de segredo não declarados, uso de chave privada não declarado, execução remota de `npx @latest` sem revisabilidade clara, metadados enganosos que ocultam o que a skill realmente precisa para executar.

## Padrões recentes que explicitamente não aceitamos

- “Criar contas de vendedor furtivas após banimentos de marketplace.”
- “Modificar o pareamento do Telegram para que usuários não aprovados recebam códigos de pareamento automaticamente.”
- “Cultivar contas do Reddit/Twitter com automação indetectável.”
- “Gerar certificados profissionais ou faturas para uso arbitrário.”
- “Gerar conteúdo NSFW com verificações de segurança desativadas.”
- “Extrair leads, enriquecer contatos e iniciar contato frio em escala.”
- “Comprar, publicar ou baixar dados vazados ou dumps de violações.”
- “Criar em massa contas de e-mail ou sociais com identidades sintéticas ou resolução de CAPTCHA.”

## Observações para revisores

- O contexto importa. O mesmo tópico pode ser legítimo em um cenário defensivo ou baseado em consentimento restrito, e inaceitável quando empacotado como um fluxo de abuso.
- Devemos favorecer a ação quando uma skill estiver claramente otimizada para evasão, engano ou uso não consensual.
- Uploads repetidos nessas categorias são motivo para ocultar conteúdo e banir a conta.

## Aplicação

- Podemos ocultar, remover ou excluir permanentemente Skills que violem estas regras.
- Podemos revogar tokens, excluir de forma reversível conteúdo associado e banir infratores reincidentes ou graves.
- Não garantimos aplicação com aviso prévio para abuso óbvio.
