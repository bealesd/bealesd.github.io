import { Utilities } from './utilites.js';
import { Router } from './router.js';
import { Sidebar } from './sidebar.js';
import { Toasts } from './toasts.js';

// TODO add posts per page option, it would reset to page one, but keep the current search and tags

export class Main {
	constructor() {
		this.SEARCH_TERM = "";
		this.ALL_POSTS = [];
		this.TOASTS = [];
		this.TAG = "";

		this.PAGE = 1;
		this.POSTS_PER_PAGE = 3;

		this.POSTS = [
			{
				'id': 'JavaScriptVariablesAndScope',
				'displayName': 'Variables And Scope',
				'tag': 'JavaScript',
				'subtags': '',
				'timestamp': '13 Apr 2018'
				// TODO get dynamically
			},
			{
				'id': 'JavaScriptPromises',
				'displayName': 'Promises',
				'tag': 'JavaScript',
				'subtags': '',
				'timestamp': '13 May 2018'
			},
			{
				'id': 'AzureVariables',
				'displayName': 'Variables',
				'tag': 'Azure',
				'subtags': '',
				'timestamp': '13 May 2020'
			},
			{
				'id': 'AzureVariables2',
				'displayName': 'Variables2',
				'tag': 'Azure',
				'subtags': '',
				'timestamp': '13 May 2020'
			},
			{
				'id': 'AzureVariables3',
				'displayName': 'Variables3',
				'tag': 'Azure',
				'subtags': '',
				'timestamp': '13 May 2020'
			}
		];

		this.utilities = new Utilities();
		this.router = new Router(this.POSTS,
			(postId) => { this.loadPostContent(postId) },
			() => { this.onListPostsLoad(); }
		);
		this.sidebar = new Sidebar(this.POSTS);
		this.toasts = new Toasts();

		window.addEventListener('DOMContentLoaded', async () => {
			window.events = window.events || {};
			const orderedPostsByTag = this.getPostByTags();
			this.sidebar.setup(orderedPostsByTag);
			await this.router.routeUrl();
		});

		window.onpopstate = async function () {
			await this.router.routeUrl();
		};
	}

	generatePostHtml(timestamp, id, displayName, tag) {
		return `
		<div class="postLinkDiv">
			<p class="timestamp">${timestamp}</p>
			<a class="postLink" id="${id}">${displayName}</a>
			<div class="tags">
				<em id='${tag}'>#${tag}</em>
			</div>
		</div>
		`;
	}

	filterPostsByTag(posts, tag) {
		let postsByTag = [];
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];
			if (post['tag'].toLocaleLowerCase() === tag.toLocaleLowerCase())
				postsByTag.push(post);
		}
		return postsByTag;
	}

	filterPostsByWord(posts, word) {
		let postsByWord = [];
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];
			if (post['displayName'].toLocaleLowerCase().includes(word.toLocaleLowerCase()))
				postsByWord.push(post);
		}
		return postsByWord;
	}

	filterPostsByRange(posts, start, end) {
		return posts.slice(start, end);
	}

	filterPosts(posts, tag, search_term) {
		let filteredPosts = [];
		if (tag && !search_term) {
			filteredPosts = this.filterPostsByTag(posts, tag);
		}
		else if (tag && search_term) {
			filteredPosts = this.filterPostsByTag(posts, tag);
			filteredPosts = this.filterPostsByWord(filteredPosts, search_term);
		}
		else {
			filteredPosts = this.filterPostsByWord(posts, search_term);
		}
		return filteredPosts;
	}

	paginatePosts(posts) {
		if (posts === null || posts === undefined || posts.length === 0) {
			return [];
		}

		const startIndex = (this.PAGE * this.POSTS_PER_PAGE) - this.POSTS_PER_PAGE;
		const endIndex = startIndex + this.POSTS_PER_PAGE;

		let paginatedPosts = posts.slice(startIndex, endIndex);

		// reset page
		if (paginatedPosts.length === 0) {
			this.PAGE = 1;
			return this.paginatePosts(posts);
		}

		return paginatedPosts;
	}

	positionPageNumbers() {
		let spacing = getComputedStyle(document.documentElement).getPropertyValue('--page-number-width-spacing').trim();
		spacing = parseInt(spacing.slice(0, spacing.length - 2));

		let pageNumberWidth = getComputedStyle(document.documentElement).getPropertyValue('--page-number-width').trim();
		pageNumberWidth = parseInt(pageNumberWidth.slice(0, pageNumberWidth.length - 2));

		let totalPageNumberWidth = this.PAGES * (pageNumberWidth + spacing);

		let sidebarWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
		sidebarWidth = parseInt(sidebarWidth.slice(0, sidebarWidth.length - 2));

		let marginLeft = sidebarWidth + ((window.innerWidth - (sidebarWidth + totalPageNumberWidth)) / 2)
		marginLeft = window.innerWidth < 700 ? 'auto' : `${marginLeft}px`;
		document.querySelector('.pageNumber').style.marginLeft = marginLeft;
	}

	setupPageNumbers(posts) {
		let pages = 0;
		if (posts === null || posts === undefined || posts.length === 0) {
			pages = 0;
		}
		else {
			pages = Math.ceil(posts.length / this.POSTS_PER_PAGE);
		}
		this.PAGES = pages;
		this.positionPageNumbers();

		const div = document.querySelector('.pageNumber');
		let anchor = '';
		for (let p = 1; p <= pages; p++) {
			anchor += `<a data-page="${p}">${p}</a>`;
		}
		div.innerHTML = anchor;

		this.utilities.managedResize('pageNumbersResize', () => {
			this.positionPageNumbers();
		});

		this.onClickPage();
		this.changeActivePageLink();
	}

	changeActivePageLink() {
		document.querySelectorAll('.pageNumber > a').forEach((anchor) => {
			anchor.classList.remove("active");
		});

		const anchor = document.querySelector(`.pageNumber > [data-page="${this.PAGE}"]`);
		anchor.classList.add("active");
	}

	generatePosts(posts) {
		let postsHtml = '';
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];
			const postHtml = this.generatePostHtml(
				post['timestamp'],
				post['id'],
				post['displayName'],
				post['tag']);

			postsHtml += postHtml;
		}
		return postsHtml;
	}

	updatePosts(postsHtml) {
		document.querySelectorAll('.postLinkDiv').forEach((postLinkDiv) => {
			postLinkDiv.remove();
		})

		const div = document.createElement('div');
		div.innerHTML = postsHtml;

		const postLinkDivs = div.querySelectorAll('.postLinkDiv');
		for (let i = postLinkDivs.length - 1; i >= 0; i--) {
			const postLinkDiv = postLinkDivs[i];
			document.querySelector('#template').prepend(postLinkDiv)

		}
	}

	reloadMain(tag, searchTerm) {
		this.TAG = tag;
		this.SEARCH_TERM = searchTerm;
		// get all the relevant posts
		let posts = this.filterPosts(this.ALL_POSTS, this.TAG, this.SEARCH_TERM);
		// get the posts for the page
		let paginatedPosts = this.paginatePosts(posts);
		// draw the posts
		let html = this.generatePosts(paginatedPosts);
		this.updatePosts(html);
		// add tag and posts link events.
		this.registerPostsEvents();
		this.setupPageNumbers(posts);
	}

	//TODO rename
	registerPostsEvents() {
		// TAG click event
		document.querySelectorAll('.tags > em').forEach((tag) => {
			this.utilities.addEvent("click", tag, (event) => {
				if (this.toasts.toasts.map((t) => { return t.split(':')[0] }).includes(event.srcElement.id)) {
					const toastId = this.toasts.toasts.filter((t) => { return t.split(':')[0] === event.srcElement.id })[0];
					this.toasts.removeToast(toastId);
					this.reloadMain('', this.SEARCH_TERM);
				}
				else {
					this.TAG = event.srcElement.id;
					this.toasts.addToast('alert-info', `Tag: ${this.TAG}`, this.TAG, (tag) => { this.reloadMain(tag, this.SEARCH_TERM); });
				}
			});
		});
		// Post load event
		document.querySelectorAll('.postLink').forEach((post) => {
			this.utilities.addEvent("click", post, async (event) => {
				this.router.changeUri(`blog\\${event.srcElement.id}`);
				this.router.routeUrl();
			});
		})
	}

	onClickPage() {
		document.querySelectorAll('.pageNumber > a').forEach((anchor) => {
			anchor.addEventListener('click', () => {
				const page = parseInt(anchor.dataset.page) ? parseInt(anchor.dataset.page) : 0;
				this.PAGE = page;
				this.reloadMain(this.TAG, this.SEARCH_TERM);
			});
		});
	}

	onListPostsLoad() {
		this.ALL_POSTS = this.soughtPostsByProperty('timestamp');

		this.router.changeUri('/blog');

		let postsHtml =
			`
			<div class='paginate'>
				<div class='later'>previous</div>				
				<div class='earlier'>next</div>
			</div>
	
			<div class='pageNumber'>
	
			</div>
		`;

		this.updateTemplate(postsHtml);

		let input = document.querySelector(`#searchInput`);
		input.focus();
		input.value = '';
		input.value = this.SEARCH_TERM;

		this.reloadMain(this.TAG, input.value);

		this.utilities.addEvent('input', document.querySelector(`#searchInput`), (event) => {
			this.SEARCH_TERM = event.srcElement.value;
			this.reloadMain(this.TAG, this.SEARCH_TERM);
		});

		this.registerPostsEvents();

		document.querySelectorAll('.paginate').forEach((paginate) => {
			this.utilities.addEvent("click", paginate, (event) => {
				if (event.srcElement.classList.contains('later')) {
					// back
					let currentPage = this.PAGE;

					if (currentPage === 1) {
						alert('No older posts!');
					}
					else {
						this.PAGE--;
						this.reloadMain(this.TAG, this.SEARCH_TERM);
					}

				}
				else if (event.srcElement.classList.contains('earlier')) {
					// forwards
					let posts = this.filterPosts(this.ALL_POSTS, this.TAG, this.SEARCH_TERM);
					let postsCount = posts.length;

					let currentPage = this.PAGE;

					if (currentPage * this.POSTS_PER_PAGE >= postsCount) {
						alert('No newer posts!');
					}
					else {
						this.PAGE++;
						this.reloadMain(this.TAG, this.SEARCH_TERM);
					}
				}
			});
		});
	}

	updateTemplate(html) {
		document.querySelector('#template').innerHTML = html;
	}

	updateLayout(html) {
		let element = document.createElement('div');
		element.innerHTML = html;
		document.querySelector('#layout').appendChild(element);
	}

	soughtPostsByProperty(property) {
		// deep copy this.POSTS
		return [...this.POSTS].sort((a, b) => {
			let x, y;
			if (property === 'timestamp') {
				x = Date.parse(a['timestamp']) * -1;
				y = Date.parse(b['timestamp']) * -1;
			}
			else {
				x = a[property].toLowerCase();
				y = b[property].toLowerCase();
			}

			return x < y ? -1 : x > y ? 1 : 0;
		})
	}

	getPostByTags() {
		// sought by displayName
		const postsByDisplayName = this.soughtPostsByProperty('displayName');

		let postsByTag = {};
		for (let i = 0; i < postsByDisplayName.length; i++) {
			const post = postsByDisplayName[i];
			if (post['tag'] in postsByTag) {
				postsByTag[post['tag']].push(post)
			}
			else {
				postsByTag[post['tag']] = [post];
			}
		}
		//group by tag
		const orderedTags = Object.keys(postsByTag).sort((a, b) => {
			let x = a.toLowerCase();
			let y = b.toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		})
		let orderedPostsByTag = {};
		for (let i = 0; i < orderedTags.length; i++) {
			const orderedTag = orderedTags[i];
			orderedPostsByTag[orderedTag] = postsByTag[orderedTag];
		}

		return orderedPostsByTag;
	}

	async loadPostContent(id) {
		this.utilities.removeResize('pageNumbersResize');

		this.toasts.clearToasts();

		this.updateTemplate('<div class="postContent"></div>');

		await this.utilities.loadPostMarkdownHtml(id);

		this.sidebar.showPostInSidebar(id);
	}

}