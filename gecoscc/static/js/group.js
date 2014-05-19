/*jslint browser: true, unparam: true, nomen: true, vars: false */
/*global App */

// Copyright 2013 Junta de Andalucia
//
// Licensed under the EUPL, Version 1.1 or - as soon they
// will be approved by the European Commission - subsequent
// versions of the EUPL (the "Licence");
// You may not use this work except in compliance with the
// Licence.
// You may obtain a copy of the Licence at:
//
// http://ec.europa.eu/idabc/eupl
//
// Unless required by applicable law or agreed to in
// writing, software distributed under the Licence is
// distributed on an "AS IS" basis,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied.
// See the Licence for the specific language governing
// permissions and limitations under the Licence.

App.module("Group.Models", function (Models, App, Backbone, Marionette, $, _) {
    "use strict";

    Models.GroupModel = App.Policies.Models.GecosResourceModel.extend({
        resourceType: "group",

        defaults: {
            type: "group",
            group_type: "user",
            lock: false,
            source: "gecos",
            name: "",
            members: [],
            memberof: [],
            policyCollection: new App.Policies.Models.PolicyCollection()
        }
    });

    Models.GroupWithoutPoliciesModel = App.GecosResourceModel.extend({
        resourceType: "group",

        defaults: {
            type: "group",
            lock: false,
            source: "gecos",
            name: "",
            members: [],
            memberof: []
        }
    });

    Models.GroupCollection = Backbone.Collection.extend({
        model: Models.GroupWithoutPoliciesModel,

        groupType: undefined,

        initialize: function(models, options) {
            if (!_.isUndefined(options) && _.has(options, "groupType")) {
                this.groupType = options.groupType;
            }
        },

        url: function () {
            if (!_.isUndefined(this.groupType)) {
                return "/api/groups/?pagesize=99999&group_type=" + this.groupType;
            } else {
                return "/api/groups/?pagesize=99999";
            }
        },

        parse: function (response) {
            return response.nodes;
        }
    });

    Models.PaginatedGroupCollection = Backbone.Paginator.requestPager.extend({
        model: Models.GroupWithoutPoliciesModel,

        groupType: undefined,

        initialize: function(models, options) {
            if (!_.isUndefined(options) && _.has(options, "groupType")) {
                this.groupType = options.groupType;
            }
        },

        paginator_core: {
            type: "GET",
            dataType: "json",
            url: "/api/groups/"
        },

        paginator_ui: {
            firstPage: 1,
            currentPage: 1,
            perPage: 16,
            pagesInRange: 2,
            // 10 as a default in case your service doesn't return the total
            totalPages: 10
        },

        server_api: {
            page: function () { return this.currentPage; },
            group_type: function () { return this.groupType; },
            pagesize: function () { return this.perPage; }
        },

        parse: function (response) {
            this.totalPages = response.pages;
            return response.nodes;
        }
    })

});
