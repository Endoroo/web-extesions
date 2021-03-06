'use strict';

/**
 * Class for conversion
 */
class LSConvert {
	/**
	 * Constructor
	 */
	constructor() {
		this.elem = {}; // DOM element for conversion
		this.mode = 0;  // Domain view mode
		this.page = ''; // Page for conversion
		this.list = {}; // List of domains
		this.sum  = 0;  // General sum of traffic

		const url = window.location.href;
		if (url.match(/.+user_detail\.cgi.+/g) !== null) {
			this.elem = document.getElementsByTagName('center')[2];
			this.page = 'u';
		}
		else if (url.match(/.+topsites\.cgi.+/g) !== null) {
			this.elem = document.getElementsByTagName('center')[1];
			this.page = 't';
		}
	}

	/**
	 * Set conversion mode
	 * @param {Number} mode Level of domain
	 */
	setMode(mode) {
		if (typeof mode !== 'number') this.mode = 0;
		this.mode = Math.floor(mode);
	}

	/**
	 * Checking properties
	 * @return {Boolean} Success or not
	 */
	checkArgs() {
		return !(typeof this.elem === 'undefined' || (this.page !== 'u' && this.page !== 't'));
	}

	/**
	 * Build list of domains
	 */
	buildList() {
		if (!this.checkArgs()) return [];

		// basic definition & check working page
		// t1 - site
		// t2 - number of connections
		// t3 - traffic
		let td1, td2, td3;
		if (this.page === 'u') { td1 = 1; td2 = 2; td3 = 3; }
		if (this.page === 't') { td1 = 2; td2 = 3; td3 = 4; }

		let links = [], trs = document.getElementsByTagName('tr'),
			tds, site, ip, conn, count, temp, i;

		// get all sites from tr
		for (i in trs) {
			// check td existence
            if (!trs.hasOwnProperty(i)) continue;
			if (typeof trs[i].getElementsByTagName !== 'function') continue;
			tds = trs[i].getElementsByTagName('td');

			// is tr valid?
			if (typeof tds[td1] === 'undefined' || typeof tds[td1].getElementsByTagName !== 'function') continue;
			if (typeof tds[td2] === 'undefined' || typeof tds[td2].getElementsByTagName !== 'function') continue;
			if (typeof tds[td3] === 'undefined' || typeof tds[td3].getElementsByTagName !== 'function') continue;

			site = tds[td1].getElementsByTagName('a')[0];
			if (typeof site === 'undefined') continue;

			// it can be IP, not domain
			ip = site.innerHTML.match(/\d+\.\d+\.\d+\.\d+$/g);

			// get level of domain
			if (this.mode === 2)
				site = site.innerHTML.match(/[^\\.]+\.[^\\.]+$/g);
			else if (this.mode === 3) {
				temp = site.innerHTML.match(/[^\\.]+\.[^\\.]+\.[^\\.]+$/g);
				if (temp === null)
					site = site.innerHTML.match(/[^\\.]+\.[^\\.]+$/g);
				else
					site = temp;
			}
			// site as is
			else
				site = [tds[td1].getElementsByTagName('font')[0].innerHTML]; // array for next checking

			if (site !== null) {
				if (ip !== null)	site = ip[0];
				else site = site[0];

				site = site.replace(/:443/g,'');
				if (!links[site]) links[site] = 0;

				// get connections as number
				conn = tds[td2].getElementsByTagName('font')[0].innerHTML.replace(/\s/g,"");

				// get traffic count in bytes
				count = tds[td3].getElementsByTagName('font')[0].innerHTML.replace(/\s/g,"");
				if (count.match(/M/g) !== null) {
						count = count.replace('M', '');
						count = count * 1024 * 1024;
					} else if (count.match(/G/g) !== null) {
						count = count.replace('G', '');
						count = count * 1024 * 1024 * 1024;
					}

				// save traffic & connections
				if (!links[site]) {
					links[site] = { traffic: 0, conn: 0 };
				}
				links[site].traffic = Number(links[site].traffic) + Number(count);
				links[site].conn    = Number(links[site].conn) + Number(conn);
			}

		}

		// convert to array of objects
		let stat = [], sum = 0;
		for (site in links) {
			if (links[site].traffic > 0) {
				count = (links[site].traffic / 1024 / 1024 / 1024).toFixed(2);
				stat.push({ site: site, traffic: count, conn: links[site].conn });
				sum = Number(sum) + Number(count);
			}
		}

		// save list for future sort
		this.list = stat;
		this.sum  = sum;
	}

	/**
	 * Sort list of domains
	 * @param {String} field Sort field
	 * @param {String} mode Sort mode
	 */
	sortList(field, mode) {
		if (field === 'traffic') {
			if (mode === 'down')
				this.list.sort(function(a, b) {
					return b.traffic - a.traffic;
				});
			if (mode === 'up')
				this.list.sort(function(a, b) {
					return a.traffic - b.traffic;
				});
		}
		if (field === 'conn') {
			if (mode === 'down')
				this.list.sort(function(a, b) {
					return b.conn - a.conn;
				});
			if (mode === 'up')
				this.list.sort(function(a, b) {
					return a.conn - b.conn;
				});
		}
	}

	/**
	 * Generate new stats makeup
	 */
	renderList() {
		if (this.checkArgs()) {
			const id = 'stat-' + this.mode + 'dl';
			let add = document.getElementById(id),
				sum = this.sum,
				div, sub, divUp1, divUp2, flag;

			// First creation
			if (add === null) {
				flag = false;

				let header = "";
				if (this.mode === 2) header = browser.i18n.getMessage("sldheader");
				if (this.mode === 3) header = browser.i18n.getMessage("tldheader");

				add = document.createElement('div');
				add.setAttribute('id', id);
				add.className = 'stat';

				// View of traffic sum
				div = document.createElement('div');
				div.className  = 'stat-sum';

				sub = document.createElement('div');
				sub.className   = 'stat-sum-text';
				sub.textContent = browser.i18n.getMessage("all");
				div.appendChild(sub);

				sub = document.createElement('div');
				sub.className   = 'stat-sum-number';
				sub.textContent = sum.toFixed(2) + ' ' + browser.i18n.getMessage("GB");
				div.appendChild(sub);

				sub = document.createElement('div');
				sub.className = 'stat-sum-space';
				div.appendChild(sub);

				add.appendChild(div);

				// Table header
				divUp2 = document.createElement('div');
				divUp2.className = 'stat-sites';

				div = document.createElement('div');
				div.className = 'stat-sites-head';

				sub = document.createElement('div');
				sub.className   = 'stat-unit-number';
				sub.textContent = '№';
				div.appendChild(sub);

				sub = document.createElement('div');
				sub.className   = 'stat-unit-domain';
				sub.textContent = header;
				div.appendChild(sub);

				sub = document.createElement('div');
				sub.className = 'stat-unit-traffic';
				sub.innerHTML = browser.i18n.getMessage("traffic") + ', ' + browser.i18n.getMessage("GB") + '<div class="sort-down"></div>';
				div.appendChild(sub);

				sub = document.createElement('div');
				sub.className = 'stat-unit-conn';
				sub.innerHTML = browser.i18n.getMessage("conn") + '<div class="sort-down"></div>';
				div.appendChild(sub);

				divUp2.appendChild(div);
			}
			// For sort
			else {
				flag = true;
				divUp2 = add.getElementsByClassName('stat-sites')[0];
			}

			// Table body
			divUp1 = document.createElement('div');
			divUp1.className = 'stat-sites-list';
			const links = this.list;
			let i;

			for (i in links) {
                if (!links.hasOwnProperty(i)) continue;
				if (links[i].traffic !== 0) {
					// Table row
					div = document.createElement('div');
					div.className = 'stat-unit';

					sub = document.createElement('div');
					sub.className   = 'stat-unit-number';
					sub.textContent = (Number(i) + Number(1));
					div.appendChild(sub);

					sub = document.createElement('div');
					sub.className   = 'stat-unit-domain';
					sub.textContent = links[i].site;
					div.appendChild(sub);

					sub = document.createElement('div');
					sub.className   = 'stat-unit-traffic';
					sub.textContent = links[i].traffic;
					div.appendChild(sub);

					sub = document.createElement('div');
					sub.className   = 'stat-unit-conn';
					sub.textContent = links[i].conn.toLocaleString();
					div.appendChild(sub);

					divUp1.appendChild(div);
				}
			}

			if (flag) {
				div = divUp2.getElementsByClassName('stat-sites-list')[0];
				divUp2.removeChild(div);
			}

			divUp2.appendChild(divUp1);

			if (!flag) {
				add.appendChild(divUp2);
				this.elem.appendChild(add);
			}
		}
	}

	/**
	 * Add sort actions to table header
	 * @param {Object} obj LSConvert object
	 */
	static addSortActions(obj) {
		let elem = document.getElementById('stat-' + obj.mode + 'dl');

		// Traffic sort
		elem.getElementsByClassName('stat-unit-traffic')[0]
		.addEventListener('click', function() {
			const sort = this.getElementsByTagName('div')[0];
			if (sort.className === 'sort-down') {
				sort.className = 'sort-up';
				obj.sortList('traffic', 'up');
				obj.renderList();
			}
			else if (sort.className === 'sort-up'){
				sort.className = 'sort-down';
				obj.sortList('traffic', 'down');
				obj.renderList();
			}
		});

		// Connection sort
		elem.getElementsByClassName('stat-unit-conn')[0]
		.addEventListener('click', function() {
			const sort = this.getElementsByTagName('div')[0];
			if (sort.className === 'sort-down') {
				sort.className = 'sort-up';
				obj.sortList('conn', 'up');
				obj.renderList();
			}
			else if (sort.className === 'sort-up'){
				sort.className = 'sort-down';
				obj.sortList('conn', 'down');
				obj.renderList();
			}
		});
	}
}

// Global var
let convert;

// Condition for work
browser.storage.sync.get('enable', function(item) {
	let flag;

	// check previous state
	if (typeof item.enable === 'undefined')
		flag = true;
	else
		flag = item.enable;

	if (flag) {
		convert = new LSConvert();

		if (convert.checkArgs()) {
			let	links, span;

			// create navigation div
			links  = document.createElement('div');
			links.setAttribute('id', 'stat-nav');

			// add first el
			span = document.createElement('span');
			span.className  += 'stat-sld';
			span.textContent = browser.i18n.getMessage('sld');
			span.addEventListener('click', function() {
				const d2 = document.getElementById('stat-2dl'),
					d3 = document.getElementById('stat-3dl');

				convert.elem.getElementsByTagName('table')[0].className = 'elem-hide';
				convert.setMode(2);
				convert.buildList();

				if (d2 !== null)
					d2.className = 'stat';
				else {
					convert.sortList('traffic', 'down');
					convert.renderList();
					LSConvert.addSortActions(convert);
				}

				if (d3 !== null)
					d3.className = 'elem-hide';
			});
			links.appendChild(span);

			// add second el
			span = document.createElement('span');
			span.className  += 'stat-tld';
			span.textContent = browser.i18n.getMessage('tld');
			span.addEventListener('click', function() {
				const d2 = document.getElementById('stat-2dl'),
					d3 = document.getElementById('stat-3dl');

				convert.elem.getElementsByTagName('table')[0].className = 'elem-hide';
				convert.setMode(3);
				convert.buildList();

				if (d2 !== null)
					d2.className = 'elem-hide';

				if (d3 !== null)
					d3.className = 'stat';
				else {
					convert.sortList('traffic', 'down');
					convert.renderList();
					LSConvert.addSortActions(convert);
				}
			});
			links.appendChild(span);

			// add third el
			span = document.createElement('span');
			span.className  += 'stat-begin';
			span.textContent = browser.i18n.getMessage('begin');
			span.addEventListener('click', function() {
				const d2 = document.getElementById('stat-2dl'),
					d3 = document.getElementById('stat-3dl');

				convert.elem.getElementsByTagName('table')[0].className = '';

				if (d2 !== null)
					d2.className = 'elem-hide';
				if (d3 !== null)
					d3.className = 'elem-hide';
			});
			links.appendChild(span);

			// add nav to page
			convert.elem.insertBefore(links, convert.elem.children[0]);
		}
	}
});