/*jslint browser: true, nomen: true, unparam: true */
/*global App, gettext */

/*
* Copyright 2013, Junta de Andalucia
* http://www.juntadeandalucia.es/
*
* Authors:
*   Alberto Beiztegui <albertobeiz@gmail.com>
*   Alejandro Blanco <alejandro.b.e@gmail.com>
*
* All rights reserved - EUPL License V 1.1
* https://joinup.ec.europa.eu/software/page/eupl/licence-eupl
*/

// Contains code from Fuel UX Tree - https://github.com/ExactTarget/fuelux
// Copyright (c) 2012 ExactTarget - Licensed under the MIT license

App.module("Tree.Views", function (Views, App, Backbone, Marionette, $, _) {
    "use strict";

    var iconClasses = {
        first: "flag",
        ou: "folder",
        user: "user",
        computer: "desktop",
        printer: "print",
        group: "group",
        storage: "hdd-o",
        repository: "archive",
        domain: "globe"
    };

    Views.getIcon = function (item) {
        var icon,
            path,
            level;

        if (item.type === "ou") {
            path = item.path || item.objpath;
            level = path.split(",").length - 1;
            icon = [iconClasses.first, iconClasses.domain][level] || iconClasses.ou;
        } else {
            icon = iconClasses[item.type];
        }
        return icon;
    };

    var treeContainerPre =
            '<div class="tree-container tree-node" style="display: block;" id="<%= id %>" data-path="<%= path %>">\n' +
            '    <div class="tree-container-header">\n' +
            '        <div class="tree-highlight">\n' +
            '            <span class="opener fa fa-<%= controlIcon %>-square-o"></span><span class="fa fa-<%= icon %>"></span>\n' +
            '            <div class="tree-name" data-toggle="tooltip" data-placement="left" title="<%= name %>"><%= ((name.length > 20)?name.substr(0, 20)+"...":name) %> <span class="extra-opts fa fa-caret-right"></span></div>\n' +
            '            <input type="checkbox" class="tree-selection">\n' +
            '        </div>\n' +
            '    </div>\n' +
            '    <div class="tree-container-content" <% if (closed) { print(\'style="display: none;"\'); } %>>\n',
        treeContainerPost =
            '    </div>\n' +
            '</div>\n',
        treeItem =
            '<div class="tree-leaf tree-node" style="display: block;" id="<%= id %>">\n' +
            '    <div class="tree-highlight">\n' +
            '        <span class="fa fa-<%= icon %>"></span>\n' +
            '        <div class="tree-name" data-toggle="tooltip" data-placement="left" title="<%= name %>"><%= ((name.length > 20)?name.substr(0, 20)+"...":name) %></div>\n' +
            '        <input type="checkbox" class="tree-selection">\n' +
            '    </div>\n' +
            '</div>\n',
        paginationItem =
            '<div class="tree-pagination tree-node" style="display: block;" data-pagination="<%= type %>">\n' +
            '    <span class="fa fa-chevron-<%= type %>"></span>\n' +
            '    <div class="tree-name">' + gettext('More') + '</div>\n' +
            '</div>\n',
        extraOpts =
            '<div class="tree-extra-options">\n' +
            '    <ul class="nav nav-pills nav-stacked">\n' +
            '        <li><a href="#ou/<%= ouId %>/new">\n' +
            '            <span class="fa fa-plus"></span> ' + gettext('Add new') + '\n' +
            '        </a></li>\n' +
            '        <li><a href="#" class="text-danger">\n' +
            '            <span class="fa fa-times"></span> ' + gettext('Delete') + '\n' +
            '        </a></li>\n' +
            '        <li><a href="#" class="text-warning">\n' +
            '            <span class="fa fa-paste"></span> ' + gettext('Paste') + '\n' +
            '        </a></li>\n' +
            '    </ul>\n' +
            '</div>\n';

    Views.Renderer = function (options) {
        this.$el = options.$el;
        this.model = options.model;

        this._templates = {
            containerPre: _.template(treeContainerPre),
            containerPost: _.template(treeContainerPost),
            item: _.template(treeItem),
            pagItem: _.template(paginationItem),
            emptyTree: _.template(emptyTree),
            extraOpts: _.template(extraOpts)
        };

        this._loader = function (size) {
            size = size || 1;
            return "<p style='font-size: " + size + "em;'><span class='fa " +
                "fa-spinner fa-spin'></span> " + gettext("Loading") +
                "...</p>";
        };

        this.render = function (view) {
            var tree = this.model.toJSON(),
                html = "",
                that = this;

            if (_.isEmpty(tree)) {
                // Empty tree
                html = this._templates.emptyTree({});
            } else {
                _.each(tree, function (child) {
                    if (_.keys(child).length > 0) {
                        html += that.recursiveRender(view, child);
                    } else {
                        html += that._loader(2.5);
                    }
                });
            }
            this.$el.html(html);
            this.renderSelection(view);
            if (!_.isNull(view.activeNode)) {
                view.highlightNodeById(view.activeNode);
            }

            return this;
        };

        this.renderSelection = function (view) {
            var oids = view.selectionInfoView.getSelection(),
                that = this;

            _.each(oids, function (id) {
                var $checkbox = that.$el.find('#' + id).find("input.tree-selection").first();
                $checkbox.attr("checked", true);
                $checkbox.parent().parent().addClass("multiselected");
            });
        };

        this.recursiveRender = function (view, node, root) {
            var json = _.pick(node, "name", "type", "id", "path"),
                ouData,
                treeNode,
                html;

            if (json.type === "ou") {
                if (_.isUndefined(root)) { root = this.model.get("tree"); }
                treeNode = root.first({ strategy: 'breadth' }, function (n) {
                    return n.model.id === json.id;
                });

                if (_.isUndefined(treeNode)) {
                    // Unloaded node
                    json.closed = true;
                    if (_.isNull(view.activeNode)) {
                        // No element selected
                        
                        // check if this node was opened previously
                        json.closed = !view.isNodeOpen(json.id);
                        if (!json.closed) {
                            this.model.loadFromPath(json.path + ',' + json.id);
                            
                            treeNode = root.first({ strategy: 'breadth' }, function (n) {
                                return n.model.id === json.id;
                            });                        
                        }
                    }
                    else if (json.id == view.activeNode) {
                        // check if this node was opened previously
                        json.closed = !view.isNodeOpen(json.id);

                        if (!json.closed) {
                            var that = this;
                            setTimeout(function(){ 
                                that.model.loadFromPath(json.path + ',' + json.id);
                                
                                treeNode = root.first({ strategy: 'breadth' }, function (n) {
                                    return n.model.id === json.id;
                                });                        
                                
                            }, 100);                            
                        }
                    }
                } else {
                    json.closed = treeNode.model.closed;
                }
                ouData = this.prepareRenderOUData(treeNode, view, view.getCurrentPageforNode(json.id));
                json.controlIcon = json.closed ? "plus" : "minus";

                html = this.renderOU(view, json, ouData, treeNode);
            } else {
                // It's a regular node
                json.icon = Views.getIcon(json);
                html = this._templates.item(json);
            }

            return html;
        };

        this.prepareRenderOUData = function (treeNode, view, savedPage) {
            var data = {
                    showPrev: false,
                    showNext: false,
                    children: []
                },
                paginatedChildren;

            if (_.isUndefined(treeNode)) { return data; }

            if (!_.isUndefined(savedPage) 
                && savedPage != treeNode.model.paginatedChildren.currentPage
                && _.isNull(view.activeNode)) {
                    
                setTimeout(function(){  
                    treeNode.model.paginatedChildren.goToPage(savedPage, {
                        success: function () { view.model.trigger("change"); }
                    }); 
                }, 100);
            }            
            
            if (treeNode.model.status === "paginated") {
                paginatedChildren = treeNode.model.paginatedChildren;
                data.children = paginatedChildren.toJSON();
                data.showPrev = paginatedChildren.currentPage > 1;
                data.showNext = paginatedChildren.currentPage < paginatedChildren.totalPages;
            } else if (treeNode.model.status === "meta-only") {
                data.children = _.map(treeNode.children, function (child) {
                    return child.model;
                });
                data.showNext = true;
            }
            return data;
        };

        this.renderOU = function (view, json, data, treeNode) {
            var html,
                that = this;

            //Do not render auxiliary nodes
            if (json.name === App.forestAuxiliary) { return ""; }

            json.icon = Views.getIcon(json);

            html = this._templates.containerPre(json);
            if (data.children.length > 0) {
                if (data.showPrev) {
                    html += this._templates.pagItem({ type: "up" });
                }
                _.each(data.children, function (child) {
                    html += that.recursiveRender(view, child, treeNode);
                });
                if (data.showNext) {
                    html += this._templates.pagItem({ type: "down" });
                }
            } 
            
            return html + this._templates.containerPost(json);
        };
    };
});
