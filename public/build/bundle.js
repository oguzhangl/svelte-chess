
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.44.2 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let link;
    	let t0;
    	let main;
    	let div16;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let div2;
    	let t6;
    	let div3;
    	let t8;
    	let div4;
    	let t10;
    	let div5;
    	let t12;
    	let div6;
    	let t14;
    	let div7;
    	let t16;
    	let div8;
    	let t18;
    	let div9;
    	let t20;
    	let div10;
    	let t22;
    	let div11;
    	let t24;
    	let div12;
    	let t26;
    	let div13;
    	let t28;
    	let div14;
    	let t30;
    	let div15;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			div16 = element("div");
    			div0 = element("div");
    			div0.textContent = "1";
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "2";
    			t4 = space();
    			div2 = element("div");
    			div2.textContent = "3";
    			t6 = space();
    			div3 = element("div");
    			div3.textContent = "4";
    			t8 = space();
    			div4 = element("div");
    			div4.textContent = "5";
    			t10 = space();
    			div5 = element("div");
    			div5.textContent = "6";
    			t12 = space();
    			div6 = element("div");
    			div6.textContent = "7";
    			t14 = space();
    			div7 = element("div");
    			div7.textContent = "8";
    			t16 = space();
    			div8 = element("div");
    			div8.textContent = "1";
    			t18 = space();
    			div9 = element("div");
    			div9.textContent = "2";
    			t20 = space();
    			div10 = element("div");
    			div10.textContent = "3";
    			t22 = space();
    			div11 = element("div");
    			div11.textContent = "4";
    			t24 = space();
    			div12 = element("div");
    			div12.textContent = "5";
    			t26 = space();
    			div13 = element("div");
    			div13.textContent = "6";
    			t28 = space();
    			div14 = element("div");
    			div14.textContent = "7";
    			t30 = space();
    			div15 = element("div");
    			div15.textContent = "8";
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/style/style.css");
    			add_location(link, file, 2, 2, 44);
    			attr_dev(div0, "class", "cell");
    			add_location(div0, file, 6, 1, 144);
    			attr_dev(div1, "class", "cell");
    			add_location(div1, file, 7, 1, 171);
    			attr_dev(div2, "class", "cell");
    			add_location(div2, file, 8, 1, 198);
    			attr_dev(div3, "class", "cell");
    			add_location(div3, file, 9, 1, 225);
    			attr_dev(div4, "class", "cell");
    			add_location(div4, file, 10, 1, 252);
    			attr_dev(div5, "class", "cell");
    			add_location(div5, file, 11, 1, 279);
    			attr_dev(div6, "class", "cell");
    			add_location(div6, file, 12, 1, 306);
    			attr_dev(div7, "class", "cell");
    			add_location(div7, file, 13, 1, 333);
    			attr_dev(div8, "class", "cell");
    			add_location(div8, file, 14, 1, 360);
    			attr_dev(div9, "class", "cell");
    			add_location(div9, file, 15, 1, 387);
    			attr_dev(div10, "class", "cell");
    			add_location(div10, file, 16, 1, 414);
    			attr_dev(div11, "class", "cell");
    			add_location(div11, file, 17, 1, 441);
    			attr_dev(div12, "class", "cell");
    			add_location(div12, file, 18, 1, 468);
    			attr_dev(div13, "class", "cell");
    			add_location(div13, file, 19, 1, 495);
    			attr_dev(div14, "class", "cell");
    			add_location(div14, file, 20, 1, 522);
    			attr_dev(div15, "class", "cell");
    			add_location(div15, file, 21, 1, 549);
    			attr_dev(div16, "class", "grid-container");
    			add_location(div16, file, 5, 0, 114);
    			add_location(main, file, 4, 0, 107);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div16);
    			append_dev(div16, div0);
    			append_dev(div16, t2);
    			append_dev(div16, div1);
    			append_dev(div16, t4);
    			append_dev(div16, div2);
    			append_dev(div16, t6);
    			append_dev(div16, div3);
    			append_dev(div16, t8);
    			append_dev(div16, div4);
    			append_dev(div16, t10);
    			append_dev(div16, div5);
    			append_dev(div16, t12);
    			append_dev(div16, div6);
    			append_dev(div16, t14);
    			append_dev(div16, div7);
    			append_dev(div16, t16);
    			append_dev(div16, div8);
    			append_dev(div16, t18);
    			append_dev(div16, div9);
    			append_dev(div16, t20);
    			append_dev(div16, div10);
    			append_dev(div16, t22);
    			append_dev(div16, div11);
    			append_dev(div16, t24);
    			append_dev(div16, div12);
    			append_dev(div16, t26);
    			append_dev(div16, div13);
    			append_dev(div16, t28);
    			append_dev(div16, div14);
    			append_dev(div16, t30);
    			append_dev(div16, div15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world',
            test: {
                a: 'abc'
            }
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
