import { Utilities } from './utilites.js';
import { Toasts } from './toasts.js';

export class BlogPostController {
	constructor(sidebar, router, blogPostIndex) {
		if (!BlogPostController.instance) {
			this.sidebar = sidebar;
			this.router = router;
			this.toasts = new Toasts();
			this.utilities = new Utilities();

			this.blogPostIndex = blogPostIndex;

			this.registerBlogPostLoadRoutes();

			BlogPostController.instance = this;
		}
		return BlogPostController.instance;
	}

	registerBlogPostLoadRoutes() {
		for (let i = 0; i < this.blogPostIndex.length; i++) {
			const postJson = this.blogPostIndex[i];
			const routeId = postJson['id'];
			this.router.routes[routeId] = () => {
				this.loadPostContent(routeId, () => {
					this.sidebar.showPostInSidebar(routeId)
				});
			}
		}
	}

	async loadPostContent(id, showPostInSidebarCb) {
		this.utilities.removeResize('pageNumbersResize');
		this.toasts.clearToasts();

		this.utilities.updatePageContent('<div class="postContent"></div>');
		await this.loadPostMarkdownHtml(id);

		showPostInSidebarCb(id);

		document.querySelector('#searchInput').hidden = true;
		document.querySelector('#blogPostSort').hidden = true;
	}

	async loadPostMarkdownHtml(pageName) {
		const languageSelector = {
			'c': () => { return Prism.languages.c; },
			'csharp': () => { return Prism.languages.csharp; },
			'git': () => { return Prism.languages.git; },
			'html': () => { return Prism.languages.html; },
			'javascript': () => { return Prism.languages.javascript; },
			'markdown': () => { return Prism.languages.markdown; },
			'python': () => { return Prism.languages.python; },
			'powershell': () => { return Prism.languages.powershell; },
			'typescript': () => { return Prism.languages.typescript; },
			'webassembly': () => { return Prism.languages.webassembly; },
			'yaml': () => { return Prism.languages.yaml; },
		}

		const response = await fetch(`/blogs/${pageName}.md`);
		let text = '';
		if (!response.ok)
			text = "# Page not found!"
		else
			text = await response.text();

		const markedWithLineNumber  = this.addLineNumbersToMarked(marked);

		marked.setOptions({
			renderer: new marked.Renderer(),
			highlight: (code, language) => {
				return Prism.highlight(code, languageSelector[language](), language);
			},
			pedantic: false,
			gfm: true,
			breaks: false,
			sanitize: false,
			smartLists: true,
			smartypants: false,
			xhtml: false
		});

		document.querySelector('.postContent').innerHTML = markedWithLineNumber(text, 'javascript');
	}

	addLineNumbersToMarked(marked) {
		const markedWithLineNumber = function (text) {
			const token = marked.lexer(text);
			text = marked.parser(token);

			const div = document.createElement('div');
			div.innerHTML = text;

			div.querySelectorAll('pre').forEach(pre => {
				pre.classList = `line-numbers language-`

				const lineCount = pre.innerText.split('\n').length;
				let linesHtml = '<span aria-hidden="true" class="line-numbers-rows">'
				for (let i = 0; i < lineCount; i++) {
					linesHtml += '<span></span>';
				}
				linesHtml += '</span>';
				pre.querySelector("code").lastElementChild.insertAdjacentHTML('afterEnd', linesHtml);
			});

			return div.innerHTML;
		};
		return markedWithLineNumber;
	}

}