'use strict'

window.onload = () => {
    shop.init(15, 1)
    selects.init()
}

const shop = {
    async init (total, page) {
        this.total = total
        this.page = page
        await this.data()
        await this.getStorage()
        this.catcheDOM()
        await this.pagination()
        await this.render(this.chairs)
        bucket.init()
        this.bindEvents()
    },
    async data () {
        return fetch('https://api.jsonbin.io/b/5e61923fbaf60366f0e44351/1')
            .then(response => {
                return response.json()
            })
            .then(data => {
                this.chairs = data
            })
            .catch(err => {
                throw err
            })
    },
    catcheDOM () {
        this.$selects = document.querySelectorAll('select');
        this.$list = document.querySelector('.store-list');
        this.$pagination = document.querySelector('.pagination');
    },
    getStorage() {
        if (localStorage.length > 0) {
            this.storage = JSON.parse(localStorage.getItem("goods"));
            (this.storage) ? this.renderStorage(this.storage) : '' ;
        }
    },
    renderStorage(storage) {
        this.goods = storage
        this.bindGoods(storage)        
    },
    bindGoods (goods){
        const chairs = this.chairs;
        this.bucket = []
        goods.forEach(element => {
            const current = chairs.find(chair => chair.id == element.id )
            current.count = element.count;
            this.bucket.push(current)
        })
    },
    bindEvents () {
        this.$pagination.addEventListener('click', event => this.changePage(event.target))
        this.$list.addEventListener('click', event => this.clickHandler(event.target))
    },
    clickHandler (element) {
        switch (element.classList[0]) {
            case ('item-button') :
                this.addGood(element)
                break;
        } 
    },
    async addGood (element) {
        let iden = element.parentNode.parentNode.parentNode.getAttribute('data-id');
        let counter = 1;
        if (this.goods){
            this.goods.forEach((element, i, a) => {
                if (element.id == iden) {
                    element.count++
                    counter = element.count
                    return
                }else if (i === a.length-1){
                    a.push({id:iden,count:counter})
                }
            })
        }else{
            this.goods = [{id:iden,count:counter}]
        }
        
        const goods = JSON.stringify(this.goods)
        localStorage.setItem("goods", goods)        
        element.classList.add('active')
        element.innerHTML = `Добавить (${counter})`
        await this.bindGoods(this.goods)
        bucket.render(this.bucket)
        
    },
    deleteGoods(goods, iden){
        this.goods = goods
        let storage = []
        
        if (goods){
            goods.forEach(element => {
                storage.push({id:element.id,count:element.count})
            })
            this.storage = storage
            const dataJson = JSON.stringify(storage)
            localStorage.setItem("goods", dataJson)
        }else{
            localStorage.clear()
        }
        if (this.$list.querySelector(`[data-id="${iden}"]`)) {
            this.$list.querySelector(`[data-id="${iden}"]`).querySelector('.item-button').innerHTML = 'Добавить';
        }
        
        
    },
    changePage (element) {
        this.page = parseInt(element.getAttribute('data-page'));
        this.pagination(this.filtered || this.chairs)
        this.render(this.filtered || this.chairs)
    },
    pagination () {
        const pages = Math.ceil(this.chairs.length / this.total);
        const pagination = this.$pagination;
        pagination.innerHTML = ''
        let min = 1;
        let max = 5;

        if (this.page > 2) {
            if (this.page < pages - 1){
                min = this.page - 2;
                max = this.page + 2;
            } else if (this.page >= pages - 1) {
                min = this.page - 3;
                max = this.page + 2;
                if (this.page === pages){
                    min = this.page - 4;
                }
            }
        } else if (this.page > 1){
            min = this.page - 1;
            max = this.page + 3;
        } else {
            min = this.page;
            max = this.page + 4;
        }
        
        
        for (let page = min; page <= pages; page + 1) {
            const active = (page === this.page) ? 'active' : '';   
            if (page >= min && page <= max) {
                const elem = `<li data-page="${page}" class="${active}">${page++}</li>`;
                pagination.insertAdjacentHTML('beforeEnd', elem)
            }else{
                break;
            }
        }
        

    },
    async filter ({by, have}){
        let array = this.chairs;
        array = (by) ? this.filterBy(array, by) : array;
        array = (have) ? this.filterHave(array, have) : array;
        this.filtered = array
        this.render(array)
        this.pagination(array)
        
    },
    filterBy(array, by){
        return array.sort((a, b) => a[by] > b[by] ? 1 : -1);
    },
    filterHave(array, have){
        const val = (have === 'have') ? true  : false;
        return array.filter(elem => elem.avaible === val)
    },
    render (chairs) {
        const max = this.page * this.total;
        const min = max - this.total;
        const list = this.$list;
        
        list.innerHTML = ''
        chairs.forEach((element, index) => {
            if (index >= min && index < max ) {
                const count = (element.count) ? `(${element.count})` : '';
                const avaible = (!element.avaible) ? `<div class="item__avaible yes">Нет в наличии</div>` : '';
                const chair = `
                <article class="item" data-id="${element.id}">
                <div class="item-container">
                <div class="item__header" style="background-image: url('${element.image}');"></div>
                <div class="item__title">${element.name}</div>
                <div class="item__desc">${element.description}</div>
                ${avaible}
                <div class="item-wrap">
                <div class="item-price">${element.price} р.</div>
                <div class="item-button">Добавить ${count}</div>
                </div>
                </div>
                </article>`;
                list.insertAdjacentHTML('beforeEnd', chair)
            } else{
                return
            }
        });
    }
}

let selects = {
    init () {
        this.clearFiltres()
        this.catcheDOM()
        this.bindEvents()
    },
    clearFiltres () {
        this.filters = {
            by: null,
            have: null
        }
    },
    catcheDOM () {
        this.$selects = document.querySelector('.selects')
    },
    bindEvents () {
        this.$selects.addEventListener('click', (event) => this.clickHandler(event.target))
    },
    clickHandler (element) {

        switch (element.tagName) {
            case ('DIV') :
                element.classList.toggle('active')
                break;
            case ('LI') :
                this.changeFilters(element)
                
        }
    },
    changeFilters (element) {
        const val = element.innerHTML;
        const parent = element.parentNode;
        const filter = parent.parentNode.getAttribute('data-select');
        const attr = element.getAttribute('data');
        element.parentNode.parentNode.classList.toggle('active')
        parent.previousElementSibling.childNodes[1].innerHTML = val;
        
        (filter === 'filter-by') ? this.filters.by = attr : this.filters.have = attr;           
        shop.filter(this.filters)
    }
}


let bucket = {
    init () {
        this.catcheDOM()
        this.bindEvents()
        this.render(shop.bucket)
    },
    catcheDOM () {
        this.$cart = document.querySelector('.store-cart');
        this.$bucket = document.querySelector('.bucket');
    },
    bindEvents () {
        this.$cart.addEventListener('click', event => this.clickHandler(event.target))
    },
    clickHandler (element) {
        
        switch (element.classList[0]) {
            case ('store-cart') :
                element.classList.toggle('active')
                break;
            case ('bucket-item__delete') :
                this.deleteGoods(element)
                break;
        }
    },
    async deleteGoods(button) {
        const iden = button.parentNode.getAttribute('data-id');
        let goods = this.goods;
        const element = goods.find(element => element.id === parseInt(iden));
        await goods.splice(goods.indexOf(element), 1)
        
        this.goods = (goods.length === 0) ? null : goods;
        shop.deleteGoods(this.goods, iden)
        
        this.render(this.goods)
        
    },
    render (goods) {
        const counter = this.$cart.querySelector('.store-cart__counter');
        const bucket = this.$bucket;
        this.goods = goods

        bucket.innerHTML = '';
        
        if (goods){
            counter.innerHTML = goods.length;
            let price = 0;
            goods.forEach((element, i, a) => {
                const inseption = (i === 0) ? '<ul class="bucket-list">' : '';
                const end = (i === a.length-1) ? '</ul>' : '';
                const html = `
                    ${inseption}
                    <li class="bucket-item" data-id="${element.id}">
                        <div class="bucket-item__image" style="background-image: url('${element.image}');"></div>
                        <div class="bucket-wrap">
                            <div class="bucket-item__title">${element.name}</div>
                            <div class="bucket-item__count">Количество: <span>${element.count}</span>
                            </div>
                        </div>
                        <div class="bucket-item__delete">
                            <img src="assets/images/icon_close.svg">
                        </div>
                    </li>
                    ${end}
                `;
                bucket.insertAdjacentHTML('beforeEnd', html)
                price = price + parseInt(element.price) * parseInt(element.count);
            })
            const footer = `
            <div class="bucket-footer">
                <p class="bucket-footer__title">Сумма товаров: </p>
                <p class="bucket-footer__price">${price} р.</p>
            </div>`;
            bucket.insertAdjacentHTML('beforeEnd', footer)
        } else {
            const empty = `<p class="bucket__empty">Добавьте товары в корзину</p>`;
            bucket.insertAdjacentHTML('beforeEnd', empty)
            counter.innerHTML = '0'
        }
        
    }
}
